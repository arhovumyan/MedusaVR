
import React, { useState, useRef } from 'react';
import { Camera, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ImageUploadService } from '@/lib/imageUpload';
import clsx from 'clsx';

interface ProfilePictureUploadProps {
  currentAvatarUrl?: string;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  className?: string;
}

export function ProfilePictureUpload({ 
  currentAvatarUrl, 
  onAvatarUpdate,
  className 
}: ProfilePictureUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate the image
    const validation = ImageUploadService.validateImage(file);
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
      
      // Upload the image to Bunny CDN via backend (this also updates the user profile)
      const uploadedUrl = await ImageUploadService.uploadImage(file);
      
      // Notify parent component of the update
      onAvatarUpdate?.(uploadedUrl);
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    // This function is no longer needed since upload is immediate
  };

  const handleCancel = () => {
    // This function is no longer needed since there's no preview
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const displayAvatar = currentAvatarUrl || user?.avatarUrl || user?.avatar || `https://ui-avatars.com/api/?background=ea580c&color=ffffff&bold=true&name=${encodeURIComponent(user?.username || 'User')}`;

  return (
    <div className={clsx("relative group", className)}>
      {/* Avatar Display */}
      <div className="relative">
        <img
          src={displayAvatar}
          alt="Profile picture"
          className="w-24 h-24 rounded-full border-2 border-orange-500/30 shadow-lg object-cover"
        />
        
        {/* Upload Overlay */}
        {!isUploading && (
          <div 
            className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
            onClick={triggerFileInput}
          >
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}

        {/* Upload Badge */}
        {!isUploading && (
          <button
            onClick={triggerFileInput}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-full border-2 border-zinc-900 flex items-center justify-center transition-colors shadow-lg"
            title="Upload new profile picture"
          >
            <Upload className="w-4 h-4 text-white" />
          </button>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
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
