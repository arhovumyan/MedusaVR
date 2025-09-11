// src/lib/imageUpload.ts
import { BunnyStorageService } from './bunnyStorage';

export class ImageUploadService {
  // Keep Cloudinary config for backward compatibility if needed
  private static CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloudinary-cloud-name';
  private static CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset';

  static validateImage(file: File): { isValid: boolean; error?: string } {
    return BunnyStorageService.validateImageFile(file, 'avatar');
  }

  static async uploadImage(file: File): Promise<string> {
    // For avatar uploads, always use the backend which uploads to Bunny CDN with proper persistence
    try {
      return await this.uploadToBackend(file);
    } catch (backendError) {
      console.error('Backend upload failed:', backendError);
      throw new Error('Failed to upload image. Please try again.');
    }
  }

  // Keep for backward compatibility if needed
  private static async uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  }

  static async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  static async resizeImage(file: File, maxWidth: number = 400, maxHeight: number = 400): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (width > height && width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        } else if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  static async uploadToBackend(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file);

    // Use the secure API request with CSRF protection
    const { secureApiRequest } = await import('../utils/csrfProtection');
    
    const response = await secureApiRequest('POST', '/api/upload/avatar', formData, {}, {
      requireCsrf: true,
      priority: 'high'
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url;
  }

  static async uploadCharacterImage(file: File, characterId?: string): Promise<string> {
    const formData = new FormData();
    formData.append('characterImage', file);
    if (characterId) {
      formData.append('characterId', characterId);
    }

    // Use the secure API request with CSRF protection
    const { secureApiRequest } = await import('../utils/csrfProtection');
    
    const response = await secureApiRequest('POST', '/api/upload/character', formData, {}, {
      requireCsrf: true,
      priority: 'high'
    });

    if (!response.ok) {
      throw new Error(`Character image upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url;
  }
}
