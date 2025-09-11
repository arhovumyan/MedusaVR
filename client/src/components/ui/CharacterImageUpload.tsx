import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploadService } from '@/lib/imageUpload';
import { CloudStorageService } from '@/lib/cloudStorage';
import clsx from 'clsx';

interface CharacterImageUploadProps {
  currentImageUrl?: string;
  characterId?: string;
  onImageUpdate?: (newImageUrl: string) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function CharacterImageUpload({ 
  currentImageUrl, 
  characterId,
  onImageUpdate,
  className,
  size = 'medium'
}: CharacterImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate the image for character upload
    const validation = CloudStorageService.validateImageFile(file, 'character');
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload the character image to Bunny CDN
      const uploadedUrl = await ImageUploadService.uploadCharacterImage(file, characterId);
      
      // Notify parent component of the update
      onImageUpdate?.(uploadedUrl);
      
      toast({
        title: "Character image updated",
        description: "The character image has been successfully updated",
      });
    } catch (error) {
      console.error('Error uploading character image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the character image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const displayImage = currentImageUrl || '/placeholder-character.png';

  return (
    <div className={clsx("relative group", className)}>
      {/* Character Image Display */}
      <div className="relative">
        <img
          src={displayImage}
          alt="Character image"
          className={clsx(
            sizeClasses[size],
            "rounded-lg border-2 border-orange-500/30 shadow-lg object-cover"
          )}
        />
        
        {/* Upload Overlay */}
        {!isUploading && (
          <div 
            className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
            onClick={triggerFileInput}
          >
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}

        {/* Upload Badge */}
        {!isUploading && (
          <button
            onClick={triggerFileInput}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 hover:bg-orange-600 rounded-full border-2 border-zinc-900 flex items-center justify-center transition-colors shadow-lg"
            title="Upload character image"
          >
            <Upload className="w-3 h-3 text-white" />
          </button>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
