import { prisma } from '../db.js';
import { generateDropToken } from '../utils/token.js';
import { sanitizeFilename, calculateExpirationDate } from '../utils/sanitizer.js';
import path from 'path';
import fs from 'fs';
import { DropResponse, FileMetadata } from '../types/index.js';

const storagePath = process.env.STORAGE_PATH || './uploads';

export class DropService {
  /**
   * Creates a new Drop, moves temp files to drop-specific folder, and saves DB record.
   */
  static async createDrop(
    uploadedFiles: Express.Multer.File[],
    expirationOption?: string
  ): Promise<DropResponse> {
    const token = generateDropToken();
    const expiresAt = calculateExpirationDate(expirationOption);
    const totalSizeBytes = uploadedFiles.reduce((sum, f) => sum + f.size, 0);

    // Create DB Drop first to obtain unique ID
    const drop = await prisma.drop.create({
      data: {
        token,
        expiresAt,
        totalSize: BigInt(totalSizeBytes),
        fileCount: uploadedFiles.length,
        status: 'ACTIVE',
      },
    });

    const dropFolder = path.join(storagePath, drop.id);
    if (!fs.existsSync(dropFolder)) {
      fs.mkdirSync(dropFolder, { recursive: true });
    }

    const fileRecordsData = [];

    for (const file of uploadedFiles) {
      const sanitizedName = sanitizeFilename(file.originalname);
      const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(sanitizedName)}`;
      const targetPath = path.join(dropFolder, uniqueFilename);

      // Move file from temp to drop directory
      fs.renameSync(file.path, targetPath);

      fileRecordsData.push({
        dropId: drop.id,
        originalName: sanitizedName,
        storedName: uniqueFilename,
        size: BigInt(file.size),
        mimeType: file.mimetype || 'application/octet-stream',
        storagePath: targetPath,
      });
    }

    // Create File records in DB
    await prisma.file.createMany({
      data: fileRecordsData,
    });

    const createdDrop = await prisma.drop.findUnique({
      where: { id: drop.id },
      include: { files: true },
    });

    if (!createdDrop) {
      throw new Error('Failed to retrieve created drop');
    }

    return this.formatDropResponse(createdDrop);
  }

  /**
   * Retrieves an active drop by token. Verifies expiration.
   */
  static async getDropByToken(token: string): Promise<{ drop: DropResponse | null; status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'NOT_FOUND' }> {
    const drop = await prisma.drop.findUnique({
      where: { token },
      include: { files: true },
    });

    if (!drop) {
      return { drop: null, status: 'NOT_FOUND' };
    }

    if (drop.status === 'REVOKED') {
      return { drop: null, status: 'REVOKED' };
    }

    // Check expiration
    const now = new Date();
    if (now > drop.expiresAt || drop.status === 'EXPIRED') {
      // Mark as expired & clean files asynchronously
      this.purgeDrop(drop.id).catch((err) => console.error('Failed to purge expired drop:', err));
      return { drop: null, status: 'EXPIRED' };
    }

    return { drop: this.formatDropResponse(drop), status: 'ACTIVE' };
  }

  /**
   * Retrieves file details for individual download.
   */
  static async getFileForDownload(token: string, fileId: string) {
    const dropResult = await this.getDropByToken(token);
    if (dropResult.status !== 'ACTIVE' || !dropResult.drop) {
      return { file: null, dropStatus: dropResult.status };
    }

    const file = await prisma.file.findFirst({
      where: { id: fileId, dropId: dropResult.drop.id },
    });

    if (!file || !fs.existsSync(file.storagePath)) {
      return { file: null, dropStatus: 'NOT_FOUND' };
    }

    // Increment download count
    await prisma.drop.update({
      where: { id: dropResult.drop.id },
      data: { downloadCount: { increment: 1 } },
    });

    return {
      file: {
        path: file.storagePath,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: Number(file.size),
      },
      dropStatus: 'ACTIVE',
    };
  }

  /**
   * Revokes a drop by token and purges files.
   */
  static async revokeDrop(token: string): Promise<boolean> {
    const drop = await prisma.drop.findUnique({ where: { token } });
    if (!drop) return false;

    await this.purgeDrop(drop.id, 'REVOKED');
    return true;
  }

  /**
   * Purges physical files and DB record for a drop ID.
   */
  static async purgeDrop(dropId: string, status: 'EXPIRED' | 'REVOKED' = 'EXPIRED') {
    try {
      const dropFolder = path.join(storagePath, dropId);

      // Remove physical folder and files
      if (fs.existsSync(dropFolder)) {
        fs.rmSync(dropFolder, { recursive: true, force: true });
      }

      // Delete file records
      await prisma.file.deleteMany({ where: { dropId } });

      if (status === 'REVOKED') {
        // Keep drop record marked as REVOKED so API can explicitly return 410 REVOKED
        await prisma.drop.update({
          where: { id: dropId },
          data: { status: 'REVOKED' },
        });
      } else {
        // Delete expired drop record completely
        await prisma.drop.delete({ where: { id: dropId } });
      }
    } catch (error) {
      console.error(`Error purging drop ${dropId}:`, error);
    }
  }

  /**
   * Formats DB Drop entity into clean client response JSON DTO.
   */
  private static formatDropResponse(drop: any): DropResponse {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    return {
      id: drop.id,
      token: drop.token,
      createdAt: drop.createdAt.toISOString(),
      expiresAt: drop.expiresAt.toISOString(),
      totalSize: Number(drop.totalSize),
      fileCount: drop.fileCount,
      downloadCount: drop.downloadCount,
      status: drop.status,
      files: (drop.files || []).map((f: any) => ({
        id: f.id,
        originalName: f.originalName,
        size: Number(f.size),
        mimeType: f.mimeType,
        createdAt: f.createdAt.toISOString(),
      })),
      recipientUrl: `${baseUrl}/drop/${drop.token}`,
    };
  }
}
