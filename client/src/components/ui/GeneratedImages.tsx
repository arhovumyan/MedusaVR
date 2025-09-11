import React, { memo, useState, useCallback } from 'react';
import { Download, X, ZoomIn, Clock } from 'lucide-react';
import { EyeIcon } from '../icons/EyeIcon';

interface GeneratedImage {
  url: string;
  id?: string;
  filename?: string;
  isBuffer?: boolean; // New property for buffer cards
}

interface GeneratedImagesProps {
  images: GeneratedImage[];
  title?: string;
  maxDisplay?: number; // New prop for limiting display
  onSeeMore?: () => void; // New prop for see more functionality
  showSeeMore?: boolean; // New prop to control see more button visibility
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
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = image.filename || `character-image-${Date.now()}.webp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
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
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl image-modal-image"
          style={{
            maxWidth: 'calc(100vw - 32px)', // Full width minus padding and button space
            maxHeight: 'calc(100vh - 32px)', // Full height minus padding
            width: 'auto',
            height: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
});

// Buffer card component for loading states
const BufferCard = memo(() => {
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 aspect-square">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-600/30 to-transparent animate-pulse" />
      
      {/* Loading content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
        <Clock className="w-8 h-8 mb-3 animate-spin text-orange-500" />
        <div className="text-sm font-medium mb-1">Generating Image</div>
        <div className="text-xs text-zinc-500">Please wait...</div>
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
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  // If this is a buffer card, render the buffer component
  if (image.isBuffer) {
    return <BufferCard />;
  }

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setAspectRatio(img.naturalWidth / img.naturalHeight);
    setImageLoaded(true);
  }, []);

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = image.filename || `character-image-${Date.now()}.webp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  }, [image]);

  return (
    <div 
      className="group relative cursor-pointer overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/20"
      onClick={() => onImageClick(image)}
      style={{
        aspectRatio: aspectRatio > 0 ? aspectRatio : 1
      }}
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
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-3">
          {/* Zoom button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(image);
            }}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          {/* Download button */}
          <button
            onClick={handleDownload}
            className="w-10 h-10 bg-orange-500/80 hover:bg-orange-500 backdrop-blur-sm border border-orange-500/40 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

const GeneratedImages: React.FC<GeneratedImagesProps> = ({ 
  images, 
  title, 
  maxDisplay = 12, 
  onSeeMore, 
  showSeeMore = false 
}) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = useCallback((image: GeneratedImage) => {
    // Don't open modal for buffer cards
    if (image.isBuffer) return;
    
    setSelectedImage(image);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedImage(null);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (!images || images.length === 0) return;
    
    try {
      // Create a temporary download for each image
      const downloadPromises = images.map(async (image, index) => {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = image.filename || `character-image-${index + 1}.webp`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Small delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      await Promise.all(downloadPromises);
    } catch (error) {
      console.error('Failed to download images:', error);
    }
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-zinc-400 text-lg">No images generated yet</div>
        <div className="text-zinc-500 text-sm mt-2">Start generating to see your character images here</div>
      </div>
    );
  }

  // Limit displayed images if maxDisplay is set
  const displayedImages = maxDisplay ? images.slice(0, maxDisplay) : images;
  const hasMore = images.length > maxDisplay;

  return (
    <>
      {title && (
        <h3 className="text-lg font-semibold text-zinc-200 mb-4">
          {title}
        </h3>
      )}
      
      {/* Responsive grid that adapts to image dimensions */}
      <div className="grid gap-4 auto-rows-max" style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      }}>
        {displayedImages.map((image, index) => (
          <ImageCard
            key={image.id || image.url || index}
            image={image}
            onImageClick={handleImageClick}
          />
        ))}
      </div>

      {/* Action Buttons */}
      {images.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Download All Button */}
          <button
            onClick={handleDownloadAll}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105"
          >
            <Download className="w-4 h-4" />
            Download All ({images.length})
          </button>
          
          {/* See More Button */}
          {(hasMore || showSeeMore) && onSeeMore && (
            <button
              onClick={onSeeMore}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 transition-all duration-300 hover:scale-105"
            >
              <EyeIcon className="w-4 h-4" />
              See All Images ({images.length})
            </button>
          )}
        </div>
      )}

      {/* Image modal */}
      <ImageModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default memo(GeneratedImages);
