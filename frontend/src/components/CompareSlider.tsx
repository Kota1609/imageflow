import { useState, useCallback, useRef, useEffect } from 'react';

interface CompareSliderProps {
  originalUrl: string;
  processedUrl: string;
  onClose: () => void;
}

export function CompareSlider({
  originalUrl,
  processedUrl,
  onClose,
}: CompareSliderProps): React.JSX.Element {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percent);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="compare-slider" onClick={onClose}>
      <button className="compare-slider__close" onClick={onClose} aria-label="Close comparison">
        ✕
      </button>

      <div
        ref={containerRef}
        className="compare-slider__container"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Processed image (bottom layer) */}
        <img src={processedUrl} alt="Processed" className="compare-slider__image" />

        {/* Original image (top layer, clipped) */}
        <div className="compare-slider__overlay" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <img src={originalUrl} alt="Original" className="compare-slider__image" />
        </div>

        {/* Divider line + handle */}
        <div className="compare-slider__divider" style={{ left: `${position}%` }}>
          <div className="compare-slider__handle">⟷</div>
        </div>

        {/* Labels */}
        <span className="compare-slider__label compare-slider__label--left">Original</span>
        <span className="compare-slider__label compare-slider__label--right">Processed</span>
      </div>
    </div>
  );
}
