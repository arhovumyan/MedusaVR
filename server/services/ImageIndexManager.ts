import { CloudinaryFolderService } from './CloudinaryFolderService.js';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Manages image index files for character folders
 * Each character folder contains an index.txt file that tracks the current image count
 */
export class ImageIndexManager {
  private static readonly INDEX_FILENAME = 'index.txt';

  /**
   * Get the next batch of image indices for a character folder and increment the counter
   * This is an atomic operation that prevents race conditions by reserving multiple indices at once
   */
  static async getNextBatchIndices(username: string, characterName: string, batchSize: number): Promise<number[]> {
    try {
      console.log(`📊 Getting next ${batchSize} image indices for ${username}/${characterName}`);
      
      // Get the index file path in Cloudinary
      const sanitizedCharacterName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const indexPublicId = `${username}/premade_characters/${sanitizedCharacterName}/images/${this.INDEX_FILENAME}`;
      
      console.log(`📁 Index file public ID: ${indexPublicId}`);

      // Try to read the current index from Cloudinary
      let currentIndex = 1; // Default to 1 for new characters
      
      try {
        // Try to fetch the existing index file
        const resource = await cloudinary.api.resource(indexPublicId, { resource_type: 'raw' });
        if (resource && resource.secure_url) {
          // Download and read the current index
          const response = await fetch(resource.secure_url);
          if (response.ok) {
            const indexContent = await response.text();
            const parsedIndex = parseInt(indexContent.trim(), 10);
            if (!isNaN(parsedIndex) && parsedIndex > 0) {
              currentIndex = parsedIndex;
              console.log(`📊 Current index from file: ${currentIndex}`);
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ Index file not found or unreadable, starting from 1: ${error}`);
      }

      // Calculate the batch of indices
      const batchIndices: number[] = [];
      for (let i = 0; i < batchSize; i++) {
        batchIndices.push(currentIndex + i);
      }
      
      const newIndex = currentIndex + batchSize;

      // Upload the new index back to Cloudinary
      try {
        const indexBuffer = Buffer.from(newIndex.toString(), 'utf8');
        const uploadResult = await CloudinaryFolderService.uploadToPremadeCharacterFolder(
          username,
          characterName,
          indexBuffer,
          this.INDEX_FILENAME,
          'images'
        );

        if (!uploadResult.success) {
          console.error(`❌ Failed to update index file: ${uploadResult.error}`);
          // Don't throw here, let the generation continue with the calculated indices
        } else {
          console.log(`✅ Updated index file to: ${newIndex}`);
        }
      } catch (error) {
        console.error(`❌ Error updating index file: ${error}`);
        // Don't throw here, let the generation continue with the calculated indices
      }

      console.log(`🎯 Returning batch indices: [${batchIndices.join(', ')}] (file now contains: ${newIndex})`);
      return batchIndices;

    } catch (error) {
      console.error(`❌ Error in getNextBatchIndices:`, error);
      // Fallback to timestamp-based indices if file operations fail
      const fallbackIndices: number[] = [];
      const baseIndex = Date.now() % 10000;
      for (let i = 0; i < batchSize; i++) {
        fallbackIndices.push(baseIndex + i);
      }
      console.log(`🔄 Using fallback indices: [${fallbackIndices.join(', ')}]`);
      return fallbackIndices;
    }
  }

  /**
   * Get the next image index for a character folder and increment the counter
   * This is an atomic operation that prevents race conditions
   */
  static async getNextIndex(username: string, characterName: string): Promise<number> {
    try {
      console.log(`📊 Getting next image index for ${username}/${characterName}`);
      
      // Get the index file path in Cloudinary
      const sanitizedCharacterName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const indexPublicId = `${username}/premade_characters/${sanitizedCharacterName}/images/${this.INDEX_FILENAME}`;
      
      console.log(`📁 Index file public ID: ${indexPublicId}`);

      // Try to read the current index from Cloudinary
      let currentIndex = 1; // Default to 1 for new characters
      
      try {
        // Try to fetch the existing index file
        const resource = await cloudinary.api.resource(indexPublicId, { resource_type: 'raw' });
        if (resource && resource.secure_url) {
          // Download and read the current index
          const response = await fetch(resource.secure_url);
          if (response.ok) {
            const indexContent = await response.text();
            const parsedIndex = parseInt(indexContent.trim(), 10);
            if (!isNaN(parsedIndex) && parsedIndex > 0) {
              currentIndex = parsedIndex;
              console.log(`📊 Current index from file: ${currentIndex}`);
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ Index file not found or unreadable, starting from 1: ${error}`);
      }

      // Calculate the next index
      const nextIndex = currentIndex;
      const newIndex = currentIndex + 1;

      // Upload the new index back to Cloudinary
      try {
        const indexBuffer = Buffer.from(newIndex.toString(), 'utf8');
        const uploadResult = await CloudinaryFolderService.uploadToPremadeCharacterFolder(
          username,
          characterName,
          indexBuffer,
          this.INDEX_FILENAME,
          'images'
        );

        if (!uploadResult.success) {
          console.error(`❌ Failed to update index file: ${uploadResult.error}`);
          // Don't throw here, let the generation continue with the calculated index
        } else {
          console.log(`✅ Updated index file to: ${newIndex}`);
        }
      } catch (error) {
        console.error(`❌ Error updating index file: ${error}`);
        // Don't throw here, let the generation continue with the calculated index
      }

      console.log(`🎯 Returning image index: ${nextIndex} (file now contains: ${newIndex})`);
      return nextIndex;

    } catch (error) {
      console.error(`❌ Error in getNextIndex:`, error);
      // Fallback to timestamp-based index if file operations fail
      const fallbackIndex = Date.now() % 10000;
      console.log(`🔄 Using fallback index: ${fallbackIndex}`);
      return fallbackIndex;
    }
  }

  /**
   * Initialize index file for a new character (called when character folder is created)
   */
  static async initializeIndex(username: string, characterName: string): Promise<boolean> {
    try {
      console.log(`🆕 Initializing index file for ${username}/${characterName}`);
      
      const indexBuffer = Buffer.from('1', 'utf8');
      const uploadResult = await CloudinaryFolderService.uploadToPremadeCharacterFolder(
        username,
        characterName,
        indexBuffer,
        this.INDEX_FILENAME,
        'images'
      );

      if (uploadResult.success) {
        console.log(`✅ Index file initialized for ${username}/${characterName}`);
        return true;
      } else {
        console.error(`❌ Failed to initialize index file: ${uploadResult.error}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error initializing index file:`, error);
      return false;
    }
  }

  /**
   * Reset index file to 1 (for testing or manual reset)
   */
  static async resetIndex(username: string, characterName: string): Promise<boolean> {
    console.log(`🔄 Resetting index file for ${username}/${characterName}`);
    return await this.initializeIndex(username, characterName);
  }
}
