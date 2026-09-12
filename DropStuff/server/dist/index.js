"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const dropRoutes_js_1 = __importDefault(require("./routes/dropRoutes.js"));
const cleanupJob_js_1 = require("./jobs/cleanupJob.js");
const db_js_1 = require("./db.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security & Parsing Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Allow inline QR SVG rendering
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// API Routes
app.use('/api', dropRoutes_js_1.default);
// System Health Endpoint
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('Unhandled express error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// Start Server & Cleanup Job
app.listen(PORT, async () => {
    console.log(`[DropStuff Server] Running on http://localhost:${PORT}`);
    try {
        await db_js_1.prisma.$connect();
        console.log('[Prisma] Database connected successfully.');
        (0, cleanupJob_js_1.initCleanupJob)();
    }
    catch (error) {
        console.error('[Prisma] Error connecting to database:', error);
    }
});
