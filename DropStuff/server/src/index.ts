import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import dropRoutes from './routes/dropRoutes.js';
import { initCleanupJob } from './jobs/cleanupJob.js';
import { prisma } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline QR SVG rendering
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', dropRoutes);

// System Health Endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server & Cleanup Job
app.listen(PORT, async () => {
  console.log(`[DropStuff Server] Running on http://localhost:${PORT}`);
  try {
    await prisma.$connect();
    console.log('[Prisma] Database connected successfully.');
    initCleanupJob();
  } catch (error) {
    console.error('[Prisma] Error connecting to database:', error);
  }
});
