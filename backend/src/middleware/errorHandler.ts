import type { Request, Response, NextFunction } from 'express';

import { AppError } from '../errors/AppError';
import type { ApiResponse } from '../types';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        level: 'error',
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
      }),
    );

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      requestId,
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'An unexpected error occurred';

  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      level: 'error',
      code: 'UNHANDLED_ERROR',
      message,
      stack: err instanceof Error ? err.stack : undefined,
    }),
  );

  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred',
    requestId,
  });
}
