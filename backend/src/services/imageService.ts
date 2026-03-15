import sharp from 'sharp';
import axios from 'axios';
import FormData from 'form-data';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

import { env } from '../config/env';
import { AppError } from '../errors/AppError';
import { CLOUDINARY_FOLDER, CLOUDINARY_ORIGINALS_FOLDER } from '../types';
import type { ProcessResult, ImageInfo, PipelineStepResult } from '../types';

// ── Cloudinary Configuration (once at import time — env is already validated) ──
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// ── Structured Logger ──────────────────────────────────────────────────
function log(action: string, requestId: string, meta?: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      action,
      ...meta,
    }),
  );
}

// ── Step 1: Remove Background via remove.bg ────────────────────────────
async function removeBackground(imageBuffer: Buffer, requestId: string): Promise<PipelineStepResult> {
  const start = Date.now();
  log('remove_background_start', requestId);

  const formData = new FormData();
  formData.append('image_file', imageBuffer, {
    filename: 'image.png',
    contentType: 'image/png',
  });
  formData.append('size', 'auto');

  try {
    const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
      headers: {
        'X-Api-Key': env.REMOVE_BG_API_KEY,
        ...formData.getHeaders(),
      },
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    const buffer = Buffer.from(response.data as ArrayBuffer);
    const durationMs = Date.now() - start;
    log('remove_background_done', requestId, { durationMs });

    return { buffer, durationMs };
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    log('remove_background_failed', requestId, { durationMs });

    if (axios.isAxiosError(error) && error.response?.status === 402) {
      throw new AppError(
        'Background removal API credits exhausted. Please try again later.',
        502,
        'REMOVE_BG_CREDITS_EXHAUSTED',
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new AppError(`Background removal failed: ${message}`, 502, 'REMOVE_BG_FAILED');
  }
}

// ── Step 2: Flip Horizontally via Sharp ────────────────────────────────
async function flipHorizontally(imageBuffer: Buffer, requestId: string): Promise<PipelineStepResult> {
  const start = Date.now();
  log('flip_start', requestId);

  try {
    const buffer = await sharp(imageBuffer).flop().png().toBuffer();
    const durationMs = Date.now() - start;
    log('flip_done', requestId, { durationMs });

    return { buffer, durationMs };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new AppError(`Image flip failed: ${message}`, 500, 'FLIP_FAILED');
  }
}

// ── Step 3: Upload to Cloudinary ───────────────────────────────────────
async function uploadToCloudinary(
  imageBuffer: Buffer,
  imageId: string,
  requestId: string,
): Promise<{ url: string; durationMs: number; bytes: number }> {
  const start = Date.now();
  log('upload_start', requestId, { imageId });

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: imageId,
        folder: CLOUDINARY_FOLDER,
        resource_type: 'image',
      },
      (error, result) => {
        const durationMs = Date.now() - start;

        if (error) {
          log('upload_failed', requestId, { durationMs });
          reject(new AppError(`Cloud upload failed: ${error.message}`, 502, 'UPLOAD_FAILED'));
          return;
        }

        if (!result) {
          log('upload_failed', requestId, { durationMs });
          reject(new AppError('Cloud upload returned no result', 502, 'UPLOAD_FAILED'));
          return;
        }

        log('upload_done', requestId, { durationMs, url: result.secure_url });
        resolve({ url: result.secure_url, durationMs, bytes: result.bytes });
      },
    );

    uploadStream.end(imageBuffer);
  });
}

// ── Step 0: Upload Original to Cloudinary (for before/after comparison) ─
async function uploadOriginal(
  imageBuffer: Buffer,
  imageId: string,
  requestId: string,
): Promise<{ url: string }> {
  const start = Date.now();
  log('upload_original_start', requestId, { imageId });

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: imageId,
        folder: CLOUDINARY_ORIGINALS_FOLDER,
        resource_type: 'image',
      },
      (error, result) => {
        const durationMs = Date.now() - start;

        if (error) {
          log('upload_original_failed', requestId, { durationMs });
          reject(new AppError(`Original upload failed: ${error.message}`, 502, 'UPLOAD_FAILED'));
          return;
        }

        if (!result) {
          log('upload_original_failed', requestId, { durationMs });
          reject(new AppError('Original upload returned no result', 502, 'UPLOAD_FAILED'));
          return;
        }

        log('upload_original_done', requestId, { durationMs, url: result.secure_url });
        resolve({ url: result.secure_url });
      },
    );

    uploadStream.end(imageBuffer);
  });
}

// ── Main Pipeline: Remove BG → Flip → Upload ──────────────────────────
export async function processImage(
  imageBuffer: Buffer,
  requestId: string,
): Promise<ProcessResult> {
  const pipelineStart = Date.now();
  const imageId = uuidv4();

  log('pipeline_start', requestId, { imageId, inputSize: imageBuffer.length });

  // Step 0: Upload original to Cloudinary (for before/after comparison)
  const originalUploaded = await uploadOriginal(imageBuffer, imageId, requestId);

  // Step 1: Remove background
  const bgRemoved = await removeBackground(imageBuffer, requestId);

  // Step 2: Flip horizontally
  const flipped = await flipHorizontally(bgRemoved.buffer, requestId);

  // Step 3: Upload processed to Cloudinary
  const uploaded = await uploadToCloudinary(flipped.buffer, imageId, requestId);

  const processingTimeMs = Date.now() - pipelineStart;
  log('pipeline_done', requestId, { imageId, processingTimeMs });

  return {
    imageId,
    url: uploaded.url,
    originalUrl: originalUploaded.url,
    processingTimeMs,
    fileSize: uploaded.bytes,
  };
}

// ── Build Original URL from Processed URL ─────────────────────────────
function getOriginalUrl(processedUrl: string, imageId: string): string {
  // Replace the processed folder with originals folder, and strip the version
  // number (v123456) since the original was uploaded separately with a different version
  return processedUrl
    .replace(`${CLOUDINARY_FOLDER}/${imageId}`, `${CLOUDINARY_ORIGINALS_FOLDER}/${imageId}`)
    .replace(/\/v\d+\//, '/');
}

// ── Get Single Image ───────────────────────────────────────────────────
export async function getImage(imageId: string): Promise<ImageInfo | null> {
  try {
    const result = await cloudinary.api.resource(`${CLOUDINARY_FOLDER}/${imageId}`);
    const url = result.secure_url as string;
    return {
      imageId,
      url,
      originalUrl: getOriginalUrl(url, imageId),
      createdAt: result.created_at as string,
      bytes: result.bytes as number,
    };
  } catch {
    return null;
  }
}

// ── List All Processed Images ──────────────────────────────────────────
export async function listImages(): Promise<ImageInfo[]> {
  const result = await cloudinary.api.resources({
    type: 'upload',
    prefix: `${CLOUDINARY_FOLDER}/`,
    max_results: 50,
    resource_type: 'image',
  });

  return (result.resources as Array<Record<string, unknown>>).map((r) => {
    const imageId = (r.public_id as string).replace(`${CLOUDINARY_FOLDER}/`, '');
    const url = r.secure_url as string;
    return {
      imageId,
      url,
      originalUrl: getOriginalUrl(url, imageId),
      createdAt: r.created_at as string,
      bytes: r.bytes as number,
    };
  });
}

// ── Delete Image ───────────────────────────────────────────────────────
export async function deleteImage(imageId: string, requestId: string): Promise<void> {
  log('delete_start', requestId, { imageId });

  try {
    // Delete both processed and original images
    await Promise.all([
      cloudinary.uploader.destroy(`${CLOUDINARY_FOLDER}/${imageId}`),
      cloudinary.uploader.destroy(`${CLOUDINARY_ORIGINALS_FOLDER}/${imageId}`),
    ]);
    log('delete_done', requestId, { imageId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new AppError(`Failed to delete image: ${message}`, 502, 'DELETE_FAILED');
  }
}
