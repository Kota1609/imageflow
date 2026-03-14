import { useState, useCallback, useRef } from 'react';

import { uploadImage } from '../utils/api';
import type { ProcessedImage, UploadStep } from '../types';

interface UseImageUploadReturn {
  isUploading: boolean;
  currentStep: UploadStep;
  previewUrl: string | null;
  error: string | null;
  startUpload: (file: File) => Promise<ProcessedImage | null>;
  reset: () => void;
}

const STEP_SEQUENCE: UploadStep[] = ['removing-bg', 'flipping', 'hosting'];
const STEP_INTERVAL_MS = 2500;

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<UploadStep>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepIndexRef = useRef(0);

  const clearStepTimer = useCallback(() => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  }, []);

  const startStepSimulation = useCallback(() => {
    stepIndexRef.current = 0;
    setCurrentStep('removing-bg');

    stepTimerRef.current = setInterval(() => {
      stepIndexRef.current += 1;
      const nextStep = STEP_SEQUENCE[stepIndexRef.current];
      if (nextStep) {
        setCurrentStep(nextStep);
      } else {
        clearInterval(stepTimerRef.current!);
        stepTimerRef.current = null;
      }
    }, STEP_INTERVAL_MS);
  }, []);

  const reset = useCallback(() => {
    clearStepTimer();
    setIsUploading(false);
    setCurrentStep('idle');
    setError(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [clearStepTimer, previewUrl]);

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

      // Create local preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setError(null);
      setIsUploading(true);
      setCurrentStep('uploading');

      try {
        // Start step simulation once upload begins server-side processing
        const result = await uploadImage(file, (percent) => {
          if (percent >= 100) {
            startStepSimulation();
          }
        });

        clearStepTimer();
        setCurrentStep('done');

        return {
          ...result,
          localOriginalUrl: objectUrl,
        };
      } catch (err: unknown) {
        clearStepTimer();
        setCurrentStep('error');
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [clearStepTimer, startStepSimulation],
  );

  return { isUploading, currentStep, previewUrl, error, startUpload, reset };
}
