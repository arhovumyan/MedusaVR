import { BunnyStorageService } from './BunnyStorageService.js';

/**
 * Image Index Service
 * Manages image numbering and indexing for premade character folders
 * Handles the index.txt file that tracks the current image number
 */
export class ImageIndexService {
  
  /**
   * Get the next image number for a character's images folder
   * Creates the index.txt file if it doesn't exist
   * @param username - The user's username
   * @param characterName - The character's name (sanitized)
   * @returns Promise<number> - The next image number to use
   */
  static async getNextImageNumber(username: string, characterName: string): Promise<number> {
    try {
      // Sanitize character name for consistent folder structure
      const sanitizedCharacterName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Construct the path to the index.txt file
      const indexFilePath = `${username}/premade_characters/${sanitizedCharacterName}/images/index.txt`;
      
      console.log(`📊 Getting next image number for: ${indexFilePath}`);
      
      // Try to read the current index
      const fileResult = await BunnyStorageService.downloadFile(indexFilePath);
      
      let currentIndex = 0;
      
      if (fileResult.success && fileResult.data) {
        // File exists, read the current index
        try {
          const indexContent = fileResult.data.toString('utf-8').trim();
          currentIndex = parseInt(indexContent, 10);
          
          if (isNaN(currentIndex) || currentIndex < 0) {
            console.warn(`⚠️ Invalid index value in ${indexFilePath}: ${indexContent}, resetting to 0`);
            currentIndex = 0;
          }
          
          console.log(`📖 Current index read from file: ${currentIndex}`);
        } catch (parseError) {
          console.warn(`⚠️ Could not parse index file ${indexFilePath}, resetting to 0:`, parseError);
          currentIndex = 0;
        }
      } else {
        // File doesn't exist, this is the first image
        console.log(`📝 Index file doesn't exist, creating for first image: ${indexFilePath}`);
        currentIndex = 0;
      }
      
      // Increment the index for the next image
      const nextIndex = currentIndex + 1;
      
      // Update the index file with the new value
      await this.updateImageIndex(username, sanitizedCharacterName, nextIndex);
      
      console.log(`✅ Next image number: ${nextIndex}`);
      return nextIndex;
      
    } catch (error) {
      console.error(`❌ Error getting next image number for ${username}/${characterName}:`, error);
      // Fallback to timestamp-based numbering if index system fails
      const fallbackNumber = Math.floor(Date.now() / 1000) % 10000;
      console.warn(`⚠️ Using fallback number: ${fallbackNumber}`);
      return fallbackNumber;
    }
  }
  
  /**
   * Update the index.txt file with the new current index
   * @param username - The user's username
   * @param sanitizedCharacterName - The sanitized character name
   * @param newIndex - The new index value to store
   * @returns Promise<boolean> - Success status
   */
  static async updateImageIndex(username: string, sanitizedCharacterName: string, newIndex: number): Promise<boolean> {
    try {
      const indexFilePath = `${username}/premade_characters/${sanitizedCharacterName}/images/index.txt`;
      const indexContent = newIndex.toString();
      
      console.log(`📝 Updating index file ${indexFilePath} with value: ${newIndex}`);
      
      // Upload the new index content
      const uploadResult = await BunnyStorageService.uploadFile(
        indexFilePath,
        Buffer.from(indexContent, 'utf-8'),
        'text/plain'
      );
      
      if (uploadResult.success) {
        console.log(`✅ Successfully updated index file: ${indexFilePath}`);
        return true;
      } else {
        console.error(`❌ Failed to update index file ${indexFilePath}:`, uploadResult.error);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ Error updating index file for ${username}/${sanitizedCharacterName}:`, error);
      return false;
    }
  }
  
  /**
   * Ensure the premade character folder structure exists
   * Creates the folder structure and index.txt if they don't exist
   * @param username - The user's username
   * @param characterName - The character's name (will be sanitized)
   * @returns Promise<boolean> - Success status
   */
  static async ensurePremadeCharacterFolderStructure(username: string, characterName: string): Promise<boolean> {
    try {
      // Sanitize character name for consistent folder structure
      const sanitizedCharacterName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      console.log(`📁 Ensuring folder structure for: ${username}/premade_characters/${sanitizedCharacterName}`);
      
      // Create the folder structure
      const baseFolder = `${username}/premade_characters/${sanitizedCharacterName}`;
      const imagesFolder = `${baseFolder}/images`;
      
      // Create the images folder (this will also create parent folders)
      const folderResult = await BunnyStorageService.createDirectory(imagesFolder);
      if (!folderResult.success) {
        console.error(`❌ Failed to create images folder: ${imagesFolder}`, folderResult.error);
        return false;
      }
      
      console.log(`✅ Created/ensured folder structure: ${imagesFolder}`);
      
      // Check if index.txt exists, create it if it doesn't
      const indexFilePath = `${imagesFolder}/index.txt`;
      const fileResult = await BunnyStorageService.downloadFile(indexFilePath);
      
      if (!fileResult.success || !fileResult.data) {
        // Index file doesn't exist, create it with initial value of 0
        console.log(`📝 Creating initial index.txt file: ${indexFilePath}`);
        
        const uploadResult = await BunnyStorageService.uploadFile(
          indexFilePath,
          Buffer.from('0', 'utf-8'),
          'text/plain'
        );
        
        if (uploadResult.success) {
          console.log(`✅ Created initial index.txt file: ${indexFilePath}`);
        } else {
          console.error(`❌ Failed to create index.txt file:`, uploadResult.error);
          return false;
        }
      } else {
        console.log(`📖 Index.txt file already exists: ${indexFilePath}`);
      }
      
      return true;
      
    } catch (error) {
      console.error(`❌ Error ensuring folder structure for ${username}/${characterName}:`, error);
      return false;
    }
  }
  
  /**
   * Generate the filename for a new image using the correct naming convention
   * @param username - The user's username
   * @param characterName - The character's name (will be sanitized)
   * @param imageNumber - The image number from the index
   * @returns string - The generated filename
   */
  static generateImageFilename(username: string, characterName: string, imageNumber: number): string {
    // Sanitize character name for consistent naming
    const sanitizedCharacterName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Generate filename: username_characterName_image_X
    const filename = `${username}_${sanitizedCharacterName}_image_${imageNumber}.png`;
    
    console.log(`📸 Generated filename: ${filename}`);
    return filename;
  }
  
  /**
   * Reset the index for a character (useful for testing or cleanup)
   * @param username - The user's username
   * @param characterName - The character's name
   * @returns Promise<boolean> - Success status
   */
  static async resetImageIndex(username: string, characterName: string): Promise<boolean> {
    try {
      const sanitizedCharacterName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      console.log(`🔄 Resetting image index for: ${username}/${sanitizedCharacterName}`);
      
      return await this.updateImageIndex(username, sanitizedCharacterName, 0);
      
    } catch (error) {
      console.error(`❌ Error resetting index for ${username}/${characterName}:`, error);
      return false;
    }
  }
  
  /**
   * Get the current image count for a character (without incrementing)
   * @param username - The user's username
   * @param characterName - The character's name
   * @returns Promise<number> - The current count (0 if no images)
   */
  static async getCurrentImageCount(username: string, characterName: string): Promise<number> {
    try {
      const sanitizedCharacterName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const indexFilePath = `${username}/premade_characters/${sanitizedCharacterName}/images/index.txt`;
      
      const fileResult = await BunnyStorageService.downloadFile(indexFilePath);
      
      if (fileResult.success && fileResult.data) {
        const indexContent = fileResult.data.toString('utf-8').trim();
        const currentIndex = parseInt(indexContent, 10);
        
        if (!isNaN(currentIndex) && currentIndex >= 0) {
          return currentIndex;
        }
      }
      
      return 0;
      
    } catch (error) {
      console.error(`❌ Error getting current image count for ${username}/${characterName}:`, error);
      return 0;
    }
  }
}
