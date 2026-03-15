import { useState, useCallback, useRef, useEffect } from 'react';

import { uploadImage } from '../utils/api';
import type { ProcessedImage, UploadStep } from '../types';

interface UseImageUploadReturn {
  isUploading: boolean;
  currentStep: UploadStep;
  uploadProgress: number;
  previewUrl: string | null;
  error: string | null;
  startUpload: (file: File) => Promise<ProcessedImage | null>;
  retry: () => Promise<ProcessedImage | null>;
  reset: () => void;
}

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<UploadStep>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastFileRef = useRef<File | null>(null);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const reset = useCallback(() => {
    setIsUploading(false);
    setCurrentStep('idle');
    setUploadProgress(0);
    setError(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const startUpload = useCallback(
    async (file: File): Promise<ProcessedImage | null> => {
      // Validate client-side
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, or WebP)');
        return null;
      }

      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setError('File is too large. Maximum size is 10MB.');
        return null;
      }

      // Store for retry
      lastFileRef.current = file;

      // Create local preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setError(null);
      setIsUploading(true);
      setCurrentStep('uploading');
      setUploadProgress(0);

      try {
        const result = await uploadImage(file, (percent) => {
          setUploadProgress(percent);
          if (percent >= 100) {
            setCurrentStep('processing');
          }
        });

        setCurrentStep('done');
        return result;
      } catch (err: unknown) {
        setCurrentStep('error');
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  const retry = useCallback(async (): Promise<ProcessedImage | null> => {
    const file = lastFileRef.current;
    if (!file) return null;
    return startUpload(file);
  }, [startUpload]);

  return { isUploading, currentStep, uploadProgress, previewUrl, error, startUpload, retry, reset };
}
