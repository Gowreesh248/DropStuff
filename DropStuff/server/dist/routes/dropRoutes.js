"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dropController_js_1 = require("../controllers/dropController.js");
const upload_js_1 = require("../middleware/upload.js");
const router = (0, express_1.Router)();
// POST /api/drops - Create drop & upload files
router.post('/drops', upload_js_1.handleDropUpload, dropController_js_1.DropController.createDrop);
// GET /api/drops/:token - Get drop metadata and file list
router.get('/drops/:token', dropController_js_1.DropController.getDrop);
// GET /api/drops/:token/files/:fileId - Download individual file
router.get('/drops/:token/files/:fileId', dropController_js_1.DropController.downloadFile);
// GET /api/drops/:token/download-all - Stream ZIP download
router.get('/drops/:token/download-all', dropController_js_1.DropController.downloadAll);
// DELETE /api/drops/:token - Revoke drop
router.delete('/drops/:token', dropController_js_1.DropController.revokeDrop);
exports.default = router;
