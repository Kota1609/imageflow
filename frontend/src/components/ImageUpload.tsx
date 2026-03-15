import { useRef, useState, useCallback } from 'react';

import { useImageUpload } from '../hooks/useImageUpload';
import { CloudUploadIcon, SpinnerIcon } from './Icons';
import type { ProcessedImage, ToastType } from '../types';

interface ImageUploadProps {
  onUpload: (image: ProcessedImage) => void;
  addToast: (message: string, type: ToastType) => void;
}

export function ImageUpload({ onUpload, addToast }: ImageUploadProps): React.JSX.Element {
  const { isUploading, currentStep, uploadProgress, previewUrl, error, startUpload, retry, reset } =
    useImageUpload();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const result = await startUpload(file);

      if (result) {
        onUpload(result);
        addToast('Image processed successfully!', 'success');
        setTimeout(() => reset(), 1500);
      }
    },
    [startUpload, onUpload, addToast, reset],
  );

  const handleRetry = useCallback(async () => {
    const result = await retry();

    if (result) {
      onUpload(result);
      addToast('Image processed successfully!', 'success');
      setTimeout(() => reset(), 1500);
    }
  }, [retry, onUpload, addToast, reset]);

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
      e.target.value = '';
    },
    [handleFile],
  );

  const zoneClasses = [
    'upload-zone',
    isDragOver ? 'upload-zone--active' : '',
    isUploading ? 'upload-zone--disabled' : '',
    currentStep === 'processing' ? 'upload-zone--processing' : '',
    currentStep === 'done' ? 'upload-zone--done' : '',
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

      {isUploading || currentStep === 'done' ? (
        <div className="upload-preview">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className={`upload-preview__image ${currentStep === 'done' ? 'upload-preview__image--done' : ''}`}
            />
          ) : null}

          {currentStep === 'uploading' ? (
            <div className="upload-zone__status">
              <div className="upload-zone__progress">
                <div
                  className="upload-zone__progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="upload-zone__status-text">Uploading... {Math.round(uploadProgress)}%</p>
            </div>
          ) : null}

          {currentStep === 'processing' ? (
            <div className="upload-zone__status">
              <SpinnerIcon size={24} className="upload-zone__spinner" />
              <p className="upload-zone__status-text">Processing your image...</p>
            </div>
          ) : null}

          {currentStep === 'done' ? (
            <p className="upload-zone__status-text upload-zone__status-text--success">Done!</p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="upload-zone__icon-wrapper">
            <CloudUploadIcon size={32} />
          </div>
          <p className="upload-zone__text">
            Drag & drop an image here, or{' '}
            <span className="upload-zone__browse">browse files</span>
          </p>
          <p className="upload-zone__hint">Supports PNG, JPG, WebP — Max 10MB</p>
        </>
      )}

      {error ? (
        <div className="upload-zone__error">
          <p>{error}</p>
          <button
            className="upload-zone__retry"
            onClick={(e) => {
              e.stopPropagation();
              handleRetry();
            }}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}
