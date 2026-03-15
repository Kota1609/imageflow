import type { Request } from 'express';

// ── API Response Envelope ──────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

// ── Image Processing ───────────────────────────────────────────────────
export interface ProcessResult {
  imageId: string;
  url: string;
  originalUrl: string;
  processingTimeMs: number;
  fileSize: number;
}

export interface ImageInfo {
  imageId: string;
  url: string;
  originalUrl: string;
  createdAt: string;
  bytes: number;
}

// ── Express Extensions ─────────────────────────────────────────────────
export interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// ── Service Layer ──────────────────────────────────────────────────────
export interface PipelineStepResult {
  buffer: Buffer;
  durationMs: number;
}

// ── Constants ──────────────────────────────────────────────────────────
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const CLOUDINARY_FOLDER = 'processed-images';
export const CLOUDINARY_ORIGINALS_FOLDER = 'original-images';
