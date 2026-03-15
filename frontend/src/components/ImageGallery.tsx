import { ImageCard } from './ImageCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ImageIcon } from './Icons';
import type { ProcessedImage, ToastType } from '../types';

interface ImageGalleryProps {
  images: ProcessedImage[];
  isLoading: boolean;
  onDelete: (imageId: string) => Promise<void>;
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
          <ImageIcon size={56} className="gallery__empty-icon" />
          <p className="gallery__empty-text">No images yet</p>
          <p className="gallery__empty-hint">Your processed images will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery">
      <h2 className="gallery__title">
        Processed Images
        {images.length > 0 ? <span className="gallery__count">{images.length}</span> : null}
      </h2>
      <div className="gallery__grid">
        {isLoading
          ? Array.from({ length: 3 }, (_, i) => <LoadingSkeleton key={`skeleton-${i}`} />)
          : images.map((image, idx) => (
              <ImageCard
                key={image.imageId}
                image={image}
                onDelete={onDelete}
                addToast={addToast}
                index={idx}
              />
            ))}
      </div>
    </div>
  );
}
