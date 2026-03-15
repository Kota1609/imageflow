import { useState, useCallback } from 'react';

import { CompareSlider } from './CompareSlider';
import { ClipboardIcon, DownloadIcon, TrashIcon, SpinnerIcon, LayersIcon, CheckIcon } from './Icons';
import type { ProcessedImage, ToastType } from '../types';

interface ImageCardProps {
  image: ProcessedImage;
  onDelete: (imageId: string) => Promise<void>;
  addToast: (message: string, type: ToastType) => void;
  index?: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageCard({ image, onDelete, addToast, index = 0 }: ImageCardProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(image.url);
      setCopied(true);
      addToast('URL copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy URL', 'error');
    }
  }, [image.url, addToast]);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `processed-${image.imageId}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      addToast('Download started', 'info');
    } catch {
      addToast('Failed to download image', 'error');
    }
  }, [image.url, image.imageId, addToast]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDelete(image.imageId);
    } finally {
      setIsDeleting(false);
    }
  }, [image.imageId, onDelete]);

  return (
    <>
      <div
        className="image-card"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div
          className="image-card__preview"
          onClick={() => (image.originalUrl ? setShowCompare(true) : undefined)}
        >
          <img src={image.url} alt="Processed image" className="image-card__image" loading="lazy" />
          {image.originalUrl ? (
            <span className="image-card__compare-badge">
              <LayersIcon size={12} /> Compare
            </span>
          ) : null}
        </div>

        <div className="image-card__meta">
          {image.processingTimeMs ? (
            <span>Processed in {(image.processingTimeMs / 1000).toFixed(1)}s</span>
          ) : null}
          {image.fileSize ? <span>{formatBytes(image.fileSize)}</span> : null}
        </div>

        <div className="image-card__actions">
          <button className="btn btn--primary" onClick={handleCopy}>
            {copied ? (
              <>
                <CheckIcon size={14} /> Copied!
              </>
            ) : (
              <>
                <ClipboardIcon size={14} /> Copy URL
              </>
            )}
          </button>
          <button className="btn btn--secondary" onClick={handleDownload}>
            <DownloadIcon size={14} /> Download
          </button>
          <button
            className="btn btn--danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <SpinnerIcon size={14} /> Deleting...
              </>
            ) : (
              <>
                <TrashIcon size={14} /> Delete
              </>
            )}
          </button>
        </div>
      </div>

      {showCompare && image.originalUrl ? (
        <CompareSlider
          originalUrl={image.originalUrl}
          processedUrl={image.url}
          onClose={() => setShowCompare(false)}
        />
      ) : null}
    </>
  );
}
