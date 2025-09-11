// ImageModalTest.tsx - Test component for responsive image modal behavior
import React, { useState, useEffect } from 'react';
import { X, Download, Monitor, Smartphone } from 'lucide-react';

interface ImageModalTestProps {
  imageUrl: string;
  imageAlt: string;
}

export default function ImageModalTest({ imageUrl, imageAlt }: ImageModalTestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [screenInfo, setScreenInfo] = useState({
    width: 0,
    height: 0,
    isMobile: false
  });

  useEffect(() => {
    const updateScreenInfo = () => {
      setScreenInfo({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 640
      });
    };

    updateScreenInfo();
    window.addEventListener('resize', updateScreenInfo);
    return () => window.removeEventListener('resize', updateScreenInfo);
  }, []);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `test-image-${Date.now()}.webp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <>
      {/* Test Button with Screen Info */}
      <div className="space-y-4">
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
        >
          Test Responsive Image Modal
        </button>
        
        {/* Screen Information Display */}
        <div className="text-sm text-zinc-400 space-y-1">
          <div className="flex items-center gap-2">
            {screenInfo.isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            <span>Screen: {screenInfo.width} × {screenInfo.height}</span>
          </div>
          <div>Device: {screenInfo.isMobile ? 'Mobile' : 'Desktop'}</div>
        </div>
      </div>

      {/* Responsive Image Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4"
          style={{ zIndex: 999999 }}
          onClick={() => setIsOpen(false)}
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
              onClick={() => setIsOpen(false)}
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
              src={imageUrl}
              alt={imageAlt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl image-modal-image"
              style={{
                maxWidth: 'calc(100vw - 32px)', // Full width minus padding and button space
                maxHeight: 'calc(100vh - 32px)', // Full height minus padding
                width: 'auto',
                height: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Debug Information Overlay */}
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs p-2 rounded">
              <div>Modal Z-Index: 999999</div>
              <div>Container: {screenInfo.isMobile ? 'calc(100vw - 8px)' : 'calc(100vw - 16px)'}</div>
              <div>Image: {screenInfo.isMobile ? 'calc(100vw - 16px)' : 'calc(100vw - 32px)'}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
