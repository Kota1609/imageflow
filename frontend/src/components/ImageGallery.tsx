import { ImageCard } from './ImageCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import type { ProcessedImage, ToastType } from '../types';

interface ImageGalleryProps {
  images: ProcessedImage[];
  isLoading: boolean;
  onDelete: (imageId: string) => void;
  addToast: (message: string, type: ToastType) => void;
}

export function ImageGallery({
  images,
  isLoading,
  onDelete,
  addToast,
}: ImageGalleryProps): React.JSX.Element | null {
  if (!isLoading && images.length === 0) {
    return (
      <div className="gallery">
        <div className="gallery__empty">
          <span className="gallery__empty-icon" aria-hidden="true">
            🖼
          </span>
          <p className="gallery__empty-text">
            No images yet. Upload one to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery">
      <h2 className="gallery__title">Processed Images</h2>
      <div className="gallery__grid">
        {isLoading
          ? Array.from({ length: 3 }, (_, i) => <LoadingSkeleton key={`skeleton-${i}`} />)
          : images.map((image) => (
              <ImageCard
                key={image.imageId}
                image={image}
                onDelete={onDelete}
                addToast={addToast}
              />
            ))}
      </div>
    </div>
  );
}
