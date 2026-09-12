import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

const storagePath = process.env.STORAGE_PATH || './uploads';
const maxFileSize = Number(process.env.MAX_FILE_SIZE) || 104857600; // 100 MB
const maxFilesPerDrop = Number(process.env.MAX_FILES_PER_DROP) || 20;
const maxTotalDropSize = Number(process.env.MAX_TOTAL_DROP_SIZE) || 524288000; // 500 MB

// Ensure storage directory exists
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

// Multer disk storage config (temporary upload dir before drop creation)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tempDir = path.join(storagePath, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
    files: maxFilesPerDrop,
  },
});

export const handleDropUpload = (req: Request, res: Response, next: NextFunction) => {
  const uploadArray = upload.array('files', maxFilesPerDrop);

  uploadArray(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: `File too large. Maximum allowed size is ${Math.round(maxFileSize / (1024 * 1024))} MB per file.`,
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: `Too many files. Maximum allowed is ${maxFilesPerDrop} files per drop.`,
        });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Upload failed due to server error.' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    // Validate total size
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > maxTotalDropSize) {
      // Clean up uploaded temp files
      files.forEach((f) => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
      return res.status(413).json({
        error: `Total drop size exceeds limit of ${Math.round(maxTotalDropSize / (1024 * 1024))} MB.`,
      });
    }

    next();
  });
};
