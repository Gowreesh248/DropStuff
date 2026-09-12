"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeFilename = sanitizeFilename;
exports.calculateExpirationDate = calculateExpirationDate;
exports.deduplicateFilenames = deduplicateFilenames;
const path_1 = __importDefault(require("path"));
/**
 * Sanitizes original filename to prevent path traversal and shell injection.
 */
function sanitizeFilename(filename) {
    // Strip null bytes and control chars
    let clean = filename.replace(/[\x00-\x1f\x7f]/g, '');
    // Extract basename to eliminate path separators
    clean = path_1.default.basename(clean);
    // Fallback if empty or dots only
    if (!clean || clean === '.' || clean === '..') {
        clean = 'unnamed_file';
    }
    return clean;
}
/**
 * Calculates expiration DateTime based on user option.
 * Options: '1h', '6h', '24h', '3d', '7d'
 */
function calculateExpirationDate(expirationOption) {
    const now = new Date();
    switch (expirationOption) {
        case '1h':
            return new Date(now.getTime() + 1 * 60 * 60 * 1000);
        case '6h':
            return new Date(now.getTime() + 6 * 60 * 60 * 1000);
        case '3d':
            return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        case '7d':
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        case '24h':
        default:
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
}
/**
 * Helper to generate deduplicated filenames for ZIP archives.
 * E.g., photo.jpg -> photo.jpg, photo.jpg -> photo (1).jpg
 */
function deduplicateFilenames(filenames) {
    const counts = new Map();
    const result = [];
    for (const name of filenames) {
        const sanitized = sanitizeFilename(name);
        const ext = path_1.default.extname(sanitized);
        const base = path_1.default.basename(sanitized, ext);
        if (!counts.has(sanitized)) {
            counts.set(sanitized, 1);
            result.push(sanitized);
        }
        else {
            const count = counts.get(sanitized);
            counts.set(sanitized, count + 1);
            const newName = `${base} (${count})${ext}`;
            result.push(newName);
        }
    }
    return result;
}
