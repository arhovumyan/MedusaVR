import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
  title?: string;
}

export function ImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  alt = "Image",
  title 
}: ImageModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medusavr-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999999] flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      {/* Modal container */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        style={{
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 32px)',
        }}
      >
        {/* Control buttons - positioned to always be visible */}
        <div className="absolute top-2 right-2 z-20 flex gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-800/90 text-white rounded-full hover:bg-zinc-700/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-800/90 text-white rounded-full hover:bg-zinc-700/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-800/90 text-white rounded-full hover:bg-zinc-700/90 transition-colors flex items-center justify-center"
            title="Download Image"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-800/90 text-white rounded-full hover:bg-zinc-700/90 transition-colors flex items-center justify-center"
            title="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Reset view button */}
        {scale !== 1 && (
          <button
            onClick={resetView}
            className="absolute top-2 left-2 z-20 w-8 h-8 sm:w-10 sm:h-10 bg-zinc-800/90 text-white rounded-full hover:bg-zinc-700/90 transition-colors flex items-center justify-center text-xs sm:text-sm"
            title="Reset View"
          >
            Reset
          </button>
        )}

        {/* Title */}
        {title && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {title}
          </div>
        )}
        
        {/* Image container with zoom and pan functionality */}
        <div 
          className="relative overflow-hidden rounded-lg shadow-2xl"
          style={{
            maxWidth: 'calc(100vw - 64px)',
            maxHeight: 'calc(100vh - 64px)',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt={alt}
            className="object-contain transition-transform duration-200 ease-out"
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '100%',
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: 'center center'
            }}
          />
        </div>

        {/* Zoom indicator */}
        {scale !== 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {Math.round(scale * 100)}%
          </div>
        )}

        {/* Instructions */}
        {scale === 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs opacity-70">
            Scroll to zoom • Drag to pan
          </div>
        )}
      </div>
    </div>
  );
}
