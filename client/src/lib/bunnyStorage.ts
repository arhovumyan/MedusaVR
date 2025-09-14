/**
 * Bunny CDN Storage Service (Client-side)
 * Manages client-side file operations and URL generation for Bunny CDN
 */
export class BunnyStorageService {
  private static publicDomain = 'medusa-vrfriendly.vercel.app'; // The public CDN domain

  /**
   * Generate the public URL for a file
   * @param filePath - The file path (e.g., "username/avatar/avatar_123.jpg")
   */
  static getPublicUrl(filePath: string): string {
    return `https://${this.publicDomain}/${filePath}`;
  }

  /**
   * Get folder paths for character folders (original structure for character creation)
   */
  static getCharacterFolderPaths(username: string, characterName: string) {
    const safeName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // For general images (no specific character), use a 'general' folder  
    const isGeneral = characterName === 'general';
    const baseFolder = isGeneral 
      ? `${username}/images` 
      : `${username}/characters/${safeName}`;
    
    return {
      baseFolder,
      avatarFolder: `${baseFolder}/avatar`,
      // For general images, don't add another 'images' subfolder
      imagesFolder: isGeneral ? baseFolder : `${baseFolder}/images`,
      variationsFolder: `${baseFolder}/variations`,
      embeddingsFolder: `${baseFolder}/embeddings`,
      generationsFolder: `${baseFolder}/generations`
    };
  }

  /**
   * Get folder paths for premade character image generations
   * Used when users generate images from existing characters
   */
  static getPremadeCharacterFolderPaths(username: string, characterName: string) {
    const safeName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const baseFolder = `${username}/premade_characters/${safeName}`;
    
    return {
      baseFolder,
      avatarFolder: `${baseFolder}/avatar`,
      imagesFolder: `${baseFolder}/images`,
      variationsFolder: `${baseFolder}/variations`,
      embeddingsFolder: `${baseFolder}/embeddings`,
      generationsFolder: `${baseFolder}/generations`
    };
  }

  /**
   * Parse a Bunny CDN URL to extract metadata
   * @param bunnyUrl - The full Bunny CDN URL
   */
  static parseBunnyUrl(bunnyUrl: string) {
    // Example URL: https://medusa-vrfriendly.vercel.app/username/characters/character-name/images/image.jpg
    const url = new URL(bunnyUrl);
    const pathParts = url.pathname.substring(1).split('/'); // Remove leading slash
    
    if (pathParts.length < 2) {
      return null;
    }

    const username = pathParts[0];
    const mainFolder = pathParts[1]; // 'characters', 'premade_characters', 'avatar', etc.
    
    let characterName = '';
    let folder = '';
    let fileName = '';

    if (mainFolder === 'characters' || mainFolder === 'premade_characters') {
      if (pathParts.length >= 4) {
        characterName = pathParts[2];
        folder = pathParts[3]; // 'avatar', 'images', 'variations', etc.
        fileName = pathParts[4] || '';
      }
    } else if (mainFolder === 'avatar') {
      folder = 'avatar';
      fileName = pathParts[2] || '';
    }
    
    return {
      username,
      mainFolder,
      characterName,
      folder,
      fileName,
      isAvatar: folder === 'avatar',
      isCharacter: mainFolder === 'characters',
      isPremadeCharacter: mainFolder === 'premade_characters',
    };
  }

  /**
   * Get recommended image dimensions for different types
   */
  static getImageDimensions(type: 'avatar' | 'character') {
    switch (type) {
      case 'avatar':
        return { width: 400, height: 400 };
      case 'character':
        return { width: 512, height: 512 };
      default:
        return { width: 400, height: 400 };
    }
  }

  /**
   * Validate image file for upload
   * @param file - The file to validate
   * @param type - The type of image (avatar or character)
   */
  static validateImageFile(file: File, type: 'avatar' | 'character') {
    const maxSizeMap = {
      avatar: 5 * 1024 * 1024, // 5MB
      character: 10 * 1024 * 1024, // 10MB for character images
    };

    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'File must be an image' };
    }

    if (file.size > maxSizeMap[type]) {
      return { isValid: false, error: 'The image is too big, choose something smaller' };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!file.type.includes('image/')) {
      return { isValid: false, error: 'Invalid file type' };
    }

    // Check specific MIME types
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Image must be JPEG, PNG, GIF, or WebP' };
    }

    return { isValid: true };
  }

  /**
   * Generate a unique filename with timestamp
   * @param baseName - Base filename without extension
   * @param extension - File extension (with dot, e.g., '.jpg')
   */
  static generateUniqueFilename(baseName: string, extension: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseName}_${timestamp}_${randomSuffix}${extension}`;
  }

  /**
   * Extract file extension from filename
   * @param filename - The filename
   */
  static getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts.pop()}` : '';
  }

  /**
   * Get MIME type from file extension
   * @param filename - The filename or extension
   */
  static getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime',
      'txt': 'text/plain',
      'json': 'application/json',
      'pdf': 'application/pdf'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}
