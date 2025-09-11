// src/pages/Chat/ImageZoomModal.tsx
import { X } from "lucide-react";

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt?: string;
}

export default function ImageZoomModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  prompt 
}: ImageZoomModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed bg-black/80 backdrop-blur-sm z-[999999] flex items-center justify-center p-2 sm:p-4"
      style={{ 
        zIndex: 999999,
        top: '80px', // Below header (approx header height + margin)
        bottom: '120px', // Above chat input (approx input height + margin)
        left: '0',
        right: '0'
      }}
      onClick={onClose}
    >
      {/* Responsive container that fits between header and input */}
      <div 
        className="relative w-full h-full flex items-center justify-center image-modal-container"
        style={{
          maxWidth: 'calc(100vw - 64px)', // Reduced width for better spacing
          maxHeight: 'calc(100vh - 280px)', // More conservative height constraint
        }}
      >
        {/* Close button - positioned to always be visible */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-zinc-800/90 text-white rounded-full hover:bg-zinc-700/90 transition-colors flex items-center justify-center"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        {/* Image with responsive constraints - fits between header and input */}
        <img
          src={imageUrl}
          alt={prompt || "Generated image"}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl image-modal-image"
          style={{
            maxWidth: 'calc(100vw - 96px)', // More conservative width 
            maxHeight: 'calc(100vh - 320px)', // More conservative height
            width: 'auto',
            height: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* Prompt caption - positioned to always be visible */}
        {prompt && (
          <div className="absolute bottom-2 left-2 right-2 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-4 rounded-lg">
            <p className="text-white text-xs sm:text-sm text-center">{prompt}</p>
          </div>
        )}
      </div>
    </div>
  );
}
