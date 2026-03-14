import { useState, useEffect, useCallback } from 'react';

import { Header } from './components/Header';
import { ImageUpload } from './components/ImageUpload';
import { ImageGallery } from './components/ImageGallery';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import * as api from './utils/api';
import type { ProcessedImage } from './types';

export default function App(): React.JSX.Element {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();

  // Fetch existing images on mount (persistent gallery)
  useEffect(() => {
    async function fetchImages(): Promise<void> {
      try {
        const existing = await api.listImages();
        setImages(existing);
      } catch {
        addToast('Failed to load existing images', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchImages();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = useCallback((image: ProcessedImage) => {
    setImages((prev) => [image, ...prev]);
  }, []);

  const handleDelete = useCallback(
    async (imageId: string) => {
      try {
        await api.deleteImage(imageId);
        setImages((prev) => prev.filter((img) => img.imageId !== imageId));
        addToast('Image deleted', 'info');
      } catch {
        addToast('Failed to delete image', 'error');
      }
    },
    [addToast],
  );

  return (
    <div className="app">
      <Header />
      <ImageUpload onUpload={handleUpload} addToast={addToast} />
      <ImageGallery
        images={images}
        isLoading={isLoading}
        onDelete={handleDelete}
        addToast={addToast}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
