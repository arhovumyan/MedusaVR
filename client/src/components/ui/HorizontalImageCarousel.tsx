import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Download, X, ZoomIn, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface GeneratedImage {
  url: string;
  id?: string;
  filename?: string;
  isBuffer?: boolean;
}

interface HorizontalImageCarouselProps {
  images: GeneratedImage[];
  title?: string;
  onImageClick?: (image: GeneratedImage) => void;
}

// Image Modal for zoom functionality
const ImageModal = memo(({ image, isOpen, onClose }: {
  image: GeneratedImage | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const handleDownload = useCallback(async () => {
    if (!image?.url) return;
    
    try {
      // For mobile devices, try to open image in a new tab as a fallback
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // On mobile, open image in new tab for user to save manually
        window.open(image.url, '_blank');
        return;
      }
      
      // Desktop download
      const response = await fetch(image.url);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = image.filename || `character-image-${Date.now()}.png`;
      link.target = '_blank';
      
      // Ensure the link is added to DOM for Firefox compatibility
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Failed to download image:', error);
      // Fallback: open image in new tab
      window.open(image.url, '_blank');
    }
  }, [image]);

  if (!isOpen || !image) return null;

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4"
      style={{ zIndex: 999999 }}
      onClick={onClose}
    >
      {/* Responsive container that never exceeds screen boundaries */}
      <div 
        className="relative w-full h-full flex items-center justify-center image-modal-container"
        style={{
          maxWidth: 'calc(100vw - 16px)', // Full width minus padding (8px on each side)
          maxHeight: 'calc(100vh - 16px)', // Full height minus padding (8px on each side)
        }}
      >
        {/* Close button - positioned to always be visible */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors duration-200 border border-white/20"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        {/* Download button - positioned to always be visible */}
        <button
          onClick={handleDownload}
          className="absolute top-2 right-12 sm:right-16 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-orange-500/80 hover:bg-orange-500 text-white rounded-full flex items-center justify-center transition-colors duration-200 border border-orange-500/40"
        >
          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>

        {/* Image with responsive constraints - never exceeds screen boundaries */}
        <img
          src={image.url}
          alt="Generated character image"
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl image-modal-image cursor-zoom-in"
          style={{
            maxWidth: 'calc(100vw - 80px)', // Full width minus padding and button space
            maxHeight: 'calc(100vh - 80px)', // Full height minus padding and buttons
            width: 'auto',
            height: 'auto',
            minWidth: '320px', // Minimum width for mobile
            minHeight: '200px' // Minimum height for mobile
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
});

// Loading banner component
const LoadingBanner = memo(() => {
  return (
    <div className="flex-shrink-0 w-48 sm:w-56 lg:w-64 h-64 sm:h-72 lg:h-80 relative overflow-hidden rounded-lg bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 border border-orange-500/30">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-600/30 to-transparent animate-pulse" />
      
      {/* Loading content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
        <Clock className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 mb-3 sm:mb-4 animate-spin text-orange-500" />
        <div className="text-sm sm:text-base lg:text-lg font-medium mb-1 sm:mb-2">Generating Image</div>
        <div className="text-xs sm:text-sm text-zinc-500">Please wait...</div>
      </div>
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
    </div>
  );
});

// Individual image card component
const ImageCard = memo(({ image, onImageClick }: {
  image: GeneratedImage;
  onImageClick: (image: GeneratedImage) => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // If this is a buffer card, render the loading banner
  if (image.isBuffer) {
    return <LoadingBanner />;
  }

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoaded(true);
  }, []);

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // For mobile devices, try to open image in a new tab as a fallback
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // On mobile, open image in new tab for user to save manually
        window.open(image.url, '_blank');
        return;
      }
      
      // Desktop download
      const response = await fetch(image.url);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = image.filename || `character-image-${Date.now()}.png`;
      link.target = '_blank';
      
      // Ensure the link is added to DOM for Firefox compatibility
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Failed to download image:', error);
      // Fallback: open image in new tab
      window.open(image.url, '_blank');
    }
  }, [image]);

  return (
    <div 
      className="flex-shrink-0 w-48 sm:w-56 lg:w-64 h-64 sm:h-72 lg:h-80 group relative cursor-pointer overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/20 border border-zinc-600/30 hover:border-orange-500/50"
      onClick={() => onImageClick(image)}
    >
      {/* Loading skeleton */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 animate-pulse rounded-lg" />
      )}
      
      {/* Main image */}
      <img
        src={image.url}
        alt="Generated character image"
        className={`w-full h-full object-cover transition-all duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } group-hover:scale-105`}
        onLoad={handleImageLoad}
        onError={() => setImageLoaded(true)}
        loading="lazy"
        decoding="async"
      />
      
      {/* Overlay with buttons (visible on hover) */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2 sm:gap-3">
          {/* Zoom button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(image);
            }}
            className="w-10 sm:w-12 h-10 sm:h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
          >
            <ZoomIn className="w-5 sm:w-6 h-5 sm:h-6" />
          </button>
          
          {/* Download button */}
          <button
            onClick={handleDownload}
            className="w-10 sm:w-12 h-10 sm:h-12 bg-orange-500/80 hover:bg-orange-500 backdrop-blur-sm border border-orange-500/40 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
          >
            <Download className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
});

const HorizontalImageCarousel: React.FC<HorizontalImageCarouselProps> = ({ 
  images, 
  title,
  onImageClick
}) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleImageClick = useCallback((image: GeneratedImage) => {
    // Don't open modal for buffer cards
    if (image.isBuffer) return;
    
    if (onImageClick) {
      onImageClick(image);
    } else {
      setSelectedImage(image);
      setIsModalOpen(true);
    }
  }, [onImageClick]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedImage(null);
  }, []);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    // Calculate scroll amount based on screen size
    let scrollAmount = 200; // Mobile: w-48 + gap
    if (window.innerWidth >= 640) scrollAmount = 240; // sm: w-56 + gap
    if (window.innerWidth >= 1024) scrollAmount = 280; // lg: w-64 + gap
    
    const newScrollPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount);
    
    container.scrollTo({
      left: newScrollPosition,
      behavior: 'smooth'
    });
    setScrollPosition(newScrollPosition);
  }, [scrollPosition]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollPosition(container.scrollLeft);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-zinc-400 text-lg">No images generated yet</div>
        <div className="text-zinc-500 text-sm mt-2">Start generating to see your character images here</div>
      </div>
    );
  }

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollContainerRef.current 
    ? scrollPosition < scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth 
    : false;

  return (
    <>
      <div className="relative">
        {title && (
          <h3 className="text-xl font-semibold text-zinc-200 mb-4 flex items-center gap-2">
            {title}
            <span className="text-orange-400">({images.length})</span>
          </h3>
        )}
        
        {/* Navigation Arrows */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 hover:bg-black/90 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 hover:bg-black/90 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Horizontal scroll container */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {images.map((image, index) => (
            <ImageCard
              key={image.id || image.url || `image-${index}`}
              image={image}
              onImageClick={handleImageClick}
            />
          ))}
        </div>
      </div>

      {/* Image modal */}
      <ImageModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default memo(HorizontalImageCarousel);
