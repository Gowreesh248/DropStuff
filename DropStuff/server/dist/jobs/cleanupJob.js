"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCleanupTask = runCleanupTask;
exports.initCleanupJob = initCleanupJob;
const node_cron_1 = __importDefault(require("node-cron"));
const db_js_1 = require("../db.js");
const dropService_js_1 = require("../services/dropService.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const storagePath = process.env.STORAGE_PATH || './uploads';
/**
 * Sweeps the database for expired drops and purges disk storage + DB records.
 */
async function runCleanupTask() {
    try {
        const now = new Date();
        const expiredDrops = await db_js_1.prisma.drop.findMany({
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
                await dropService_js_1.DropService.purgeDrop(drop.id, 'EXPIRED');
            }
        }
        // Clean up orphan temporary files in uploads/temp
        const tempFolder = path_1.default.join(storagePath, 'temp');
        if (fs_1.default.existsSync(tempFolder)) {
            const tempFiles = fs_1.default.readdirSync(tempFolder);
            const fileThreshold = Date.now() - 2 * 60 * 60 * 1000; // 2 hours old
            for (const file of tempFiles) {
                const filePath = path_1.default.join(tempFolder, file);
                const stats = fs_1.default.statSync(filePath);
                if (stats.mtimeMs < fileThreshold) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
        }
    }
    catch (error) {
        console.error('[Cleanup Job] Error running cleanup task:', error);
    }
}
/**
 * Initializes cron schedule for periodic cleanup (every 5 minutes).
 */
function initCleanupJob() {
    // Run cleanup once on startup
    runCleanupTask();
    // Schedule task every 5 minutes
    node_cron_1.default.schedule('*/5 * * * *', () => {
        runCleanupTask();
    });
}
