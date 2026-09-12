import cron from 'node-cron';
import { prisma } from '../db.js';
import { DropService } from '../services/dropService.js';
import fs from 'fs';
import path from 'path';

const storagePath = process.env.STORAGE_PATH || './uploads';

/**
 * Sweeps the database for expired drops and purges disk storage + DB records.
 */
export async function runCleanupTask(): Promise<void> {
  try {
    const now = new Date();
    const expiredDrops = await prisma.drop.findMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { status: 'EXPIRED' },
          { status: 'REVOKED' },
        ],
      },
    });

    if (expiredDrops.length > 0) {
      console.log(`[Cleanup Job] Found ${expiredDrops.length} expired/revoked drops to purge.`);
      for (const drop of expiredDrops) {
        await DropService.purgeDrop(drop.id, 'EXPIRED');
      }
    }

    // Clean up orphan temporary files in uploads/temp
    const tempFolder = path.join(storagePath, 'temp');
    if (fs.existsSync(tempFolder)) {
      const tempFiles = fs.readdirSync(tempFolder);
      const fileThreshold = Date.now() - 2 * 60 * 60 * 1000; // 2 hours old
      for (const file of tempFiles) {
        const filePath = path.join(tempFolder, file);
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs < fileThreshold) {
          fs.unlinkSync(filePath);
        }
      }
    }
  } catch (error) {
    console.error('[Cleanup Job] Error running cleanup task:', error);
  }
}

/**
 * Initializes cron schedule for periodic cleanup (every 5 minutes).
 */
export function initCleanupJob(): void {
  // Run cleanup once on startup
  runCleanupTask();

  // Schedule task every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    runCleanupTask();
  });
}
