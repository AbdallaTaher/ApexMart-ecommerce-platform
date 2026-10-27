import { useState, useRef } from 'react';
import { HiSparkles, HiMagnifyingGlassPlus } from 'react-icons/hi2';

/**
 * Multi-Angle Interactive Product Image Gallery
 * Features thumbnail navigation, high-resolution zoom lens, and compositor-only transforms.
 *
 * @param {Object} props
 * @param {string[]} props.images - Array of image URLs (cover + gallery)
 * @param {string} props.title - Product title for alt text
 * @param {string} [props.badge] - Optional badge (e.g., 'Best Seller')
 */
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80&fm=webp';

export default function ImageGallery({ images = [], title = 'Product', badge = 'None' }) {
  // Normalize images array to ensure valid fallback
  const validImages = Array.isArray(images) && images.length > 0
    ? images.filter(Boolean)
    : [FALLBACK_IMAGE];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef(null);

  const activeImage = validImages[activeIndex] || validImages[0] || FALLBACK_IMAGE;

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => setIsZoomed(true);
  const handleMouseLeave = () => {
    setIsZoomed(false);
    setZoomPosition({ x: 50, y: 50 });
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4 w-full">
      {/* 1. Multi-Angle Thumbnail Strip */}
      {validImages.length > 1 && (
        <div
          className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[520px] pb-2 lg:pb-0 scrollbar-none"
          role="tablist"
          aria-label="Product image thumbnails"
        >
          {validImages.map((imgUrl, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`View product image ${idx + 1}`}
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`relative flex-shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden border-2 bg-white dark:bg-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-brand-amber ${
                  isActive
                    ? 'border-brand-amber shadow-sm ring-1 ring-brand-amber'
                    : 'border-gray-200 dark:border-brand-darkborder hover:border-gray-400 dark:hover:border-gray-600 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`${title} thumbnail ${idx + 1}`}
                  width={72}
                  height={72}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (e.target.src !== FALLBACK_IMAGE) {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_IMAGE;
                    }
                  }}
                  className="w-full h-full object-contain p-1"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Main Hero Stage with Compositor-Only Zoom Lens */}
      <div className="flex-1 flex flex-col items-center">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative w-full max-w-[540px] aspect-square rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200/90 dark:border-brand-darkborder p-4 sm:p-8 flex items-center justify-center overflow-hidden cursor-crosshair group shadow-sm select-none"
          aria-label="Main product view, hover to zoom"
        >
          {/* Badge indicator */}
          {badge && badge !== 'None' && (
            <span className="absolute top-3 left-3 z-20 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-primary text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
              <HiSparkles className="w-3.5 h-3.5 text-brand-amber" />
              {badge}
            </span>
          )}

          {/* Zoom hint overlay icon */}
          <div className="absolute bottom-3 right-3 z-20 p-1.5 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 group-hover:opacity-0 transition-opacity pointer-events-none">
            <HiMagnifyingGlassPlus className="w-4 h-4" />
          </div>

          {/* Hero Image with Hardware-Accelerated Zoom */}
          <img
            src={activeImage}
            alt={title}
            width={540}
            height={540}
            fetchPriority="high"
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (e.target.src !== FALLBACK_IMAGE) {
                e.target.onerror = null;
                e.target.src = FALLBACK_IMAGE;
              }
            }}
            className="w-full h-full object-contain transition-transform duration-100 ease-out will-change-transform"
            style={{
              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
              transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
            }}
          />
        </div>

        <p className="hidden sm:block text-[11px] text-gray-400 dark:text-gray-500 mt-2 text-center">
          Roll over image to zoom in
        </p>
      </div>
    </div>
  );
}
