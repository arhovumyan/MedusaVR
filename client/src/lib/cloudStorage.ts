// Cloud Storage Service - Now redirects to Bunny CDN for compatibility
import { BunnyStorageService } from './bunnyStorage';

export class CloudStorageService {
  
  /**
   * Get the folder structure for a user (now uses Bunny CDN)
   * @param username - The user's username
   */
  static getUserFolderStructure(username: string) {
    const characterPaths = BunnyStorageService.getCharacterFolderPaths(username, 'general');
    return {
      root: username,
      avatar: characterPaths.avatarFolder,
      characters: `${username}/characters`,
    };
  }

  /**
   * Generate a character image public ID (now uses Bunny CDN naming)
   * @param username - The user's username
   * @param characterId - Optional character ID for updates
   */
  static generateCharacterImageId(username: string, characterId?: string): string {
    return BunnyStorageService.generateUniqueFilename(
      characterId ? `character_${characterId}` : 'character',
      '.png'
    );
  }

  /**
   * Generate an avatar image public ID (now uses Bunny CDN naming)
   * @param username - The user's username
   */
  static generateAvatarImageId(username: string): string {
    return BunnyStorageService.generateUniqueFilename('avatar', '.jpg');
  }

  /**
   * Parse a URL to extract metadata (now supports both Cloudinary and Bunny CDN)
   * @param imageUrl - The full image URL
   */
  static parseCloudinaryUrl(imageUrl: string) {
    // Try parsing as Bunny CDN first
    const bunnyResult = BunnyStorageService.parseBunnyUrl(imageUrl);
    if (bunnyResult) {
      return {
        fileName: bunnyResult.fileName,
        folder: bunnyResult.folder,
        username: bunnyResult.username,
        isAvatar: bunnyResult.isAvatar,
        isCharacter: bunnyResult.isCharacter,
      };
    }

    // Fallback to original Cloudinary parsing for backward compatibility
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const username = urlParts[urlParts.length - 3];
    
    return {
      fileName,
      folder,
      username,
      isAvatar: folder === 'avatar',
      isCharacter: folder === 'characters',
    };
  }

  /**
   * Get recommended image dimensions for different types (delegates to Bunny CDN service)
   */
  static getImageDimensions(type: 'avatar' | 'character') {
    return BunnyStorageService.getImageDimensions(type);
  }

  /**
   * Validate image file for upload (delegates to Bunny CDN service)
   * @param file - The file to validate
   * @param type - The type of image (avatar or character)
   */
  static validateImageFile(file: File, type: 'avatar' | 'character') {
    return BunnyStorageService.validateImageFile(file, type);
  }
}
