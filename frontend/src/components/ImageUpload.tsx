import { useRef, useState, useCallback } from 'react';

import { useImageUpload } from '../hooks/useImageUpload';
import type { ProcessedImage, ToastType, UploadStep } from '../types';

interface ImageUploadProps {
  onUpload: (image: ProcessedImage) => void;
  addToast: (message: string, type: ToastType) => void;
}

const STEP_LABELS: Record<UploadStep, string> = {
  idle: '',
  uploading: 'Uploading',
  'removing-bg': 'Removing Background',
  flipping: 'Flipping',
  hosting: 'Hosting',
  done: 'Done',
  error: 'Failed',
};

const STEPS: UploadStep[] = ['uploading', 'removing-bg', 'flipping', 'hosting'];

function getStepState(
  step: UploadStep,
  currentStep: UploadStep,
): 'pending' | 'active' | 'done' {
  const currentIdx = STEPS.indexOf(currentStep);
  const stepIdx = STEPS.indexOf(step);

  if (currentStep === 'done') return 'done';
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

export function ImageUpload({ onUpload, addToast }: ImageUploadProps): React.JSX.Element {
  const { isUploading, currentStep, previewUrl, error, startUpload, reset } = useImageUpload();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const result = await startUpload(file);

      if (result) {
        onUpload(result);
        addToast('Image processed successfully!', 'success');
        // Reset after a short delay so user sees "done" state
        setTimeout(() => reset(), 1500);
      }
    },
    [startUpload, onUpload, addToast, reset],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // Reset input so same file can be re-selected
      e.target.value = '';
    },
    [handleFile],
  );

  const zoneClasses = [
    'upload-zone',
    isDragOver ? 'upload-zone--active' : '',
    isUploading ? 'upload-zone--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={zoneClasses}
      onDragOver={(e) => {
        e.preventDefault();
        if (!isUploading) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={isUploading ? (e) => e.preventDefault() : handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!isUploading) fileInputRef.current?.click();
        }
      }}
      aria-label="Upload image by clicking or dragging a file here"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="upload-preview">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="upload-preview__image" />
          ) : null}

          <div className="steps">
            {STEPS.map((step, idx) => {
              const state = getStepState(step, currentStep);
              return (
                <div key={step}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {idx > 0 ? <span className="step__separator" /> : null}
                    <span
                      className={`step ${state === 'active' ? 'step--active' : ''} ${state === 'done' ? 'step--done' : ''}`}
                    >
                      <span className="step__dot" />
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <span className="upload-zone__icon" aria-hidden="true">
            +
          </span>
          <p className="upload-zone__text">
            Drag &amp; drop an image here, or click to browse
          </p>
          <p className="upload-zone__hint">Supports PNG, JPG, WebP — Max 10MB</p>
        </>
      )}

      {error ? (
        <p style={{ color: 'var(--danger)', marginTop: 'var(--space-4)', fontSize: '14px' }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
