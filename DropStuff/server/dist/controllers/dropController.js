"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropController = void 0;
const dropService_js_1 = require("../services/dropService.js");
const zipService_js_1 = require("../services/zipService.js");
class DropController {
    /**
     * POST /api/drops - Create drop and upload files
     */
    static async createDrop(req, res) {
        try {
            const files = req.files;
            const expiration = req.body.expiration || undefined;
            if (!files || files.length === 0) {
                res.status(400).json({ error: 'At least one file must be provided.' });
                return;
            }
            const drop = await dropService_js_1.DropService.createDrop(files, expiration);
            res.status(201).json(drop);
        }
        catch (error) {
            console.error('Error creating drop:', error);
            res.status(500).json({ error: error.message || 'Internal server error creating drop.' });
        }
    }
    /**
     * GET /api/drops/:token - Get drop metadata & file list
     */
    static async getDrop(req, res) {
        try {
            const token = req.params.token;
            const result = await dropService_js_1.DropService.getDropByToken(token);
            if (result.status === 'NOT_FOUND') {
                res.status(404).json({ error: 'Drop not found.' });
                return;
            }
            if (result.status === 'EXPIRED') {
                res.status(410).json({ error: 'This drop has expired.', status: 'EXPIRED' });
                return;
            }
            if (result.status === 'REVOKED') {
                res.status(410).json({ error: 'This drop is no longer available.', status: 'REVOKED' });
                return;
            }
            res.status(200).json(result.drop);
        }
        catch (error) {
            console.error('Error fetching drop:', error);
            res.status(500).json({ error: 'Failed to retrieve drop.' });
        }
    }
    /**
     * GET /api/drops/:token/files/:fileId - Download individual file
     */
    static async downloadFile(req, res) {
        try {
            const token = req.params.token;
            const fileId = req.params.fileId;
            const result = await dropService_js_1.DropService.getFileForDownload(token, fileId);
            if (result.dropStatus === 'EXPIRED') {
                res.status(410).json({ error: 'This drop has expired.' });
                return;
            }
            if (result.dropStatus === 'REVOKED') {
                res.status(410).json({ error: 'This drop is no longer available.' });
                return;
            }
            if (!result.file) {
                res.status(404).json({ error: 'File not found.' });
                return;
            }
            const { path: filePath, originalName, mimeType } = result.file;
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
            res.sendFile(filePath, { root: '.' });
        }
        catch (error) {
            console.error('Error downloading file:', error);
            res.status(500).json({ error: 'Failed to download file.' });
        }
    }
    /**
     * GET /api/drops/:token/download-all - Stream all files as ZIP archive
     */
    static async downloadAll(req, res) {
        try {
            const token = req.params.token;
            await zipService_js_1.ZipService.streamDropZip(token, res);
        }
        catch (error) {
            console.error('Error streaming ZIP archive:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to generate ZIP archive.' });
            }
        }
    }
    /**
     * DELETE /api/drops/:token - Revoke a drop immediately
     */
    static async revokeDrop(req, res) {
        try {
            const token = req.params.token;
            const success = await dropService_js_1.DropService.revokeDrop(token);
            if (!success) {
                res.status(404).json({ error: 'Drop not found or already revoked.' });
                return;
            }
            res.status(200).json({ message: 'Drop has been successfully revoked.' });
        }
        catch (error) {
            console.error('Error revoking drop:', error);
            res.status(500).json({ error: 'Failed to revoke drop.' });
        }
    }
}
exports.DropController = DropController;
