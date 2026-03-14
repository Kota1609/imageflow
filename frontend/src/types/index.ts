// ── Image Data ─────────────────────────────────────────────────────────
export interface ProcessedImage {
  imageId: string;
  url: string;
  processingTimeMs?: number;
  fileSize?: number;
  createdAt?: string;
  localOriginalUrl?: string;
}

// ── Upload State ───────────────────────────────────────────────────────
export type UploadStep = 'idle' | 'uploading' | 'removing-bg' | 'flipping' | 'hosting' | 'done' | 'error';

export interface UploadState {
  isUploading: boolean;
  currentStep: UploadStep;
  previewUrl: string | null;
  error: string | null;
}

// ── Toast ──────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// ── API Response ───────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

export interface ApiProcessResult {
  imageId: string;
  url: string;
  processingTimeMs: number;
  fileSize: number;
}

export interface ApiImageInfo {
  imageId: string;
  url: string;
  createdAt: string;
  bytes: number;
}
