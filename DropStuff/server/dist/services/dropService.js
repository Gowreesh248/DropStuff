"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropService = void 0;
const db_js_1 = require("../db.js");
const token_js_1 = require("../utils/token.js");
const sanitizer_js_1 = require("../utils/sanitizer.js");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const storagePath = process.env.STORAGE_PATH || './uploads';
class DropService {
    /**
     * Creates a new Drop, moves temp files to drop-specific folder, and saves DB record.
     */
    static async createDrop(uploadedFiles, expirationOption) {
        const token = (0, token_js_1.generateDropToken)();
        const expiresAt = (0, sanitizer_js_1.calculateExpirationDate)(expirationOption);
        const totalSizeBytes = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
        // Create DB Drop first to obtain unique ID
        const drop = await db_js_1.prisma.drop.create({
            data: {
                token,
                expiresAt,
                totalSize: BigInt(totalSizeBytes),
                fileCount: uploadedFiles.length,
                status: 'ACTIVE',
            },
        });
        const dropFolder = path_1.default.join(storagePath, drop.id);
        if (!fs_1.default.existsSync(dropFolder)) {
            fs_1.default.mkdirSync(dropFolder, { recursive: true });
        }
        const fileRecordsData = [];
        for (const file of uploadedFiles) {
            const sanitizedName = (0, sanitizer_js_1.sanitizeFilename)(file.originalname);
            const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e6)}${path_1.default.extname(sanitizedName)}`;
            const targetPath = path_1.default.join(dropFolder, uniqueFilename);
            // Move file from temp to drop directory
            fs_1.default.renameSync(file.path, targetPath);
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
        await db_js_1.prisma.file.createMany({
            data: fileRecordsData,
        });
        const createdDrop = await db_js_1.prisma.drop.findUnique({
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
    static async getDropByToken(token) {
        const drop = await db_js_1.prisma.drop.findUnique({
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
    static async getFileForDownload(token, fileId) {
        const dropResult = await this.getDropByToken(token);
        if (dropResult.status !== 'ACTIVE' || !dropResult.drop) {
            return { file: null, dropStatus: dropResult.status };
        }
        const file = await db_js_1.prisma.file.findFirst({
            where: { id: fileId, dropId: dropResult.drop.id },
        });
        if (!file || !fs_1.default.existsSync(file.storagePath)) {
            return { file: null, dropStatus: 'NOT_FOUND' };
        }
        // Increment download count
        await db_js_1.prisma.drop.update({
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
    static async revokeDrop(token) {
        const drop = await db_js_1.prisma.drop.findUnique({ where: { token } });
        if (!drop)
            return false;
        await this.purgeDrop(drop.id, 'REVOKED');
        return true;
    }
    /**
     * Purges physical files and DB record for a drop ID.
     */
    static async purgeDrop(dropId, status = 'EXPIRED') {
        try {
            const dropFolder = path_1.default.join(storagePath, dropId);
            // Remove physical folder and files
            if (fs_1.default.existsSync(dropFolder)) {
                fs_1.default.rmSync(dropFolder, { recursive: true, force: true });
            }
            // Delete file records
            await db_js_1.prisma.file.deleteMany({ where: { dropId } });
            if (status === 'REVOKED') {
                // Keep drop record marked as REVOKED so API can explicitly return 410 REVOKED
                await db_js_1.prisma.drop.update({
                    where: { id: dropId },
                    data: { status: 'REVOKED' },
                });
            }
            else {
                // Delete expired drop record completely
                await db_js_1.prisma.drop.delete({ where: { id: dropId } });
            }
        }
        catch (error) {
            console.error(`Error purging drop ${dropId}:`, error);
        }
    }
    /**
     * Formats DB Drop entity into clean client response JSON DTO.
     */
    static formatDropResponse(drop) {
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
            files: (drop.files || []).map((f) => ({
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
exports.DropService = DropService;
