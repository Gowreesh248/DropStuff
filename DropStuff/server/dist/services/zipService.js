"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZipService = void 0;
const archiver_1 = __importDefault(require("archiver"));
const fs_1 = __importDefault(require("fs"));
const db_js_1 = require("../db.js");
const dropService_js_1 = require("./dropService.js");
const sanitizer_js_1 = require("../utils/sanitizer.js");
class ZipService {
    /**
     * Streams a ZIP file containing all files for a drop token directly to the Express HTTP response.
     */
    static async streamDropZip(token, res) {
        const dropResult = await dropService_js_1.DropService.getDropByToken(token);
        if (dropResult.status !== 'ACTIVE' || !dropResult.drop) {
            if (dropResult.status === 'EXPIRED') {
                res.status(410).json({ error: 'This drop has expired.' });
                return;
            }
            if (dropResult.status === 'REVOKED') {
                res.status(410).json({ error: 'This drop is no longer available.' });
                return;
            }
            res.status(404).json({ error: 'Drop not found.' });
            return;
        }
        const drop = dropResult.drop;
        // Fetch full File entities including storagePaths from DB
        const dbFiles = await db_js_1.prisma.file.findMany({
            where: { dropId: drop.id },
        });
        if (!dbFiles || dbFiles.length === 0) {
            res.status(404).json({ error: 'No files available in this drop.' });
            return;
        }
        // Deduplicate original filenames for safe archive paths
        const originalNames = dbFiles.map((f) => f.originalName);
        const archiveFilenames = (0, sanitizer_js_1.deduplicateFilenames)(originalNames);
        // Set Response Headers for ZIP Download
        const zipFilename = `dropstuff-${token}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
        // Initialize archiver
        const archive = (0, archiver_1.default)('zip', {
            zlib: { level: 5 }, // Compression level
        });
        archive.on('error', (err) => {
            console.error('Archiver error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error generating ZIP archive.' });
            }
        });
        // Pipe archive data to response stream
        archive.pipe(res);
        // Append files to ZIP
        for (let i = 0; i < dbFiles.length; i++) {
            const fileRecord = dbFiles[i];
            const entryName = archiveFilenames[i];
            if (fs_1.default.existsSync(fileRecord.storagePath)) {
                archive.file(fileRecord.storagePath, { name: entryName });
            }
        }
        // Increment download count
        await db_js_1.prisma.drop.update({
            where: { id: drop.id },
            data: { downloadCount: { increment: 1 } },
        });
        // Finalize ZIP archive stream
        await archive.finalize();
    }
}
exports.ZipService = ZipService;
