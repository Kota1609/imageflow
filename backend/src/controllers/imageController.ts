import type { Request, Response, NextFunction } from 'express';

import * as imageService from '../services/imageService';
import type { MulterRequest, ApiResponse, ProcessResult, ImageInfo } from '../types';

// ── Async Handler Wrapper ──────────────────────────────────────────────
function asyncHandler<P = unknown, ResBody = unknown, ReqBody = unknown>(
  fn: (req: Request<P, ResBody, ReqBody>, res: Response<ResBody>, next: NextFunction) => Promise<void>,
) {
  return (req: Request<P, ResBody, ReqBody>, res: Response<ResBody>, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}

// ── Upload & Process Image ─────────────────────────────────────────────
export const uploadImage = asyncHandler(
  async (req: MulterRequest, res: Response<ApiResponse<ProcessResult>>) => {
    const file = req.file!; // validated by middleware
    const result = await imageService.processImage(file.buffer, req.requestId);

    res.status(201).json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  },
);

// ── Get Single Image ───────────────────────────────────────────────────
export const getImage = asyncHandler(
  async (req: Request<{ imageId: string }>, res: Response<ApiResponse<ImageInfo>>) => {
    const image = await imageService.getImage(req.params.imageId);

    if (!image) {
      res.status(404).json({
        success: false,
        error: 'Image not found',
        requestId: req.requestId,
      });
      return;
    }

    res.json({
      success: true,
      data: image,
      requestId: req.requestId,
    });
  },
);

// ── List All Processed Images ──────────────────────────────────────────
export const listImages = asyncHandler(
  async (req: Request, res: Response<ApiResponse<ImageInfo[]>>) => {
    const images = await imageService.listImages();

    res.json({
      success: true,
      data: images,
      requestId: req.requestId,
    });
  },
);

// ── Delete Image ───────────────────────────────────────────────────────
export const deleteImage = asyncHandler(
  async (req: Request<{ imageId: string }>, res: Response<ApiResponse>) => {
    await imageService.deleteImage(req.params.imageId, req.requestId);

    res.json({
      success: true,
      requestId: req.requestId,
    });
  },
);
