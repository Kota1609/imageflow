import type { ApiResponse, ApiProcessResult, ApiImageInfo, ProcessedImage } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// ── Error Extraction ───────────────────────────────────────────────────
function extractError(data: ApiResponse): string {
  return data.error ?? 'Something went wrong';
}

// ── Upload Image (uses XHR for progress tracking) ──────────────────────
export function uploadImage(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('image', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const response = JSON.parse(xhr.responseText) as ApiResponse<ApiProcessResult>;

        if (xhr.status >= 400 || !response.success || !response.data) {
          reject(new Error(extractError(response)));
          return;
        }

        const { imageId, url, originalUrl, processingTimeMs, fileSize } = response.data;
        resolve({ imageId, url, originalUrl, processingTimeMs, fileSize });
      } catch {
        reject(new Error('Failed to parse server response'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error — please check your connection'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out — please try again'));
    });

    xhr.open('POST', `${BASE_URL}/api/images/upload`);
    xhr.timeout = 60000;
    xhr.send(formData);
  });
}

// ── List All Images ────────────────────────────────────────────────────
export async function listImages(): Promise<ProcessedImage[]> {
  const res = await fetch(`${BASE_URL}/api/images`);
  const data = (await res.json()) as ApiResponse<ApiImageInfo[]>;

  if (!res.ok || !data.success || !data.data) {
    throw new Error(extractError(data));
  }

  return data.data.map((img) => ({
    imageId: img.imageId,
    url: img.url,
    originalUrl: img.originalUrl,
    fileSize: img.bytes,
    createdAt: img.createdAt,
  }));
}

// ── Delete Image ───────────────────────────────────────────────────────
export async function deleteImage(imageId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/images/${imageId}`, {
    method: 'DELETE',
  });

  const data = (await res.json()) as ApiResponse;

  if (!res.ok || !data.success) {
    throw new Error(extractError(data));
  }
}
