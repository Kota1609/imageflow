import type { Response, NextFunction } from 'express';

import { AppError } from '../errors/AppError';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../types';
import type { MulterRequest } from '../types';

export function validateImageUpload(req: MulterRequest, _res: Response, next: NextFunction): void {
  if (!req.file) {
    throw new AppError('No image file provided', 400, 'NO_FILE');
  }

  const { mimetype, size } = req.file;

  if (!ALLOWED_MIME_TYPES.includes(mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new AppError(
      `Unsupported file type: ${mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      400,
      'INVALID_FILE_TYPE',
    );
  }

  if (size > MAX_FILE_SIZE) {
    const maxMb = MAX_FILE_SIZE / (1024 * 1024);
    throw new AppError(`File too large. Maximum size is ${maxMb}MB`, 400, 'FILE_TOO_LARGE');
  }

  next();
}
