import express from 'express';
import cors from 'cors';
import multer from 'multer';

import { env } from './config/env';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { validateImageUpload } from './middleware/validate';
import * as imageController from './controllers/imageController';
import { MAX_FILE_SIZE } from './types';

const app = express();

// ── Upload Configuration ───────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

// ── Global Middleware ──────────────────────────────────────────────────
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(requestIdMiddleware);

// ── Health Check ───────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Image API Routes ───────────────────────────────────────────────────
app.post(
  '/api/images/upload',
  upload.single('image'),
  validateImageUpload,
  imageController.uploadImage,
);

app.get('/api/images', imageController.listImages);
app.get('/api/images/:imageId', imageController.getImage);
app.delete('/api/images/:imageId', imageController.deleteImage);

// ── Global Error Handler (must be last) ────────────────────────────────
app.use(errorHandler);

export { app };
