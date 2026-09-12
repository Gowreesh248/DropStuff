import { Router } from 'express';
import { DropController } from '../controllers/dropController.js';
import { handleDropUpload } from '../middleware/upload.js';

const router = Router();

// POST /api/drops - Create drop & upload files
router.post('/drops', handleDropUpload, DropController.createDrop);

// GET /api/drops/:token - Get drop metadata and file list
router.get('/drops/:token', DropController.getDrop);

// GET /api/drops/:token/files/:fileId - Download individual file
router.get('/drops/:token/files/:fileId', DropController.downloadFile);

// GET /api/drops/:token/download-all - Stream ZIP download
router.get('/drops/:token/download-all', DropController.downloadAll);

// DELETE /api/drops/:token - Revoke drop
router.delete('/drops/:token', DropController.revokeDrop);

export default router;
