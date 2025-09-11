import { v2 as cloudinary } from 'cloudinary';

export class CloudinaryFolderService {
  /**
   * Configure Cloudinary if not already configured
   */
  private static ensureConfigured() {
    if (!cloudinary.config().cloud_name) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
  }

  /**
   * Checks if Cloudinary is properly configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET
    );
  }
  /**
   * Creates the folder structure for a new user in Cloudinary
   * @param username - The user's username
   * @returns Promise<boolean> - Success status
   */
  static async createUserFolders(username: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.warn('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
        return false;
      }

      // Ensure Cloudinary is configured
      this.ensureConfigured();

      console.log(`Creating Cloudinary folder structure for user: ${username}`);
      
      const userFolder = username;
      const avatarFolder = `${userFolder}/avatar`;
      const charactersFolder = `${userFolder}/characters`;

      // Create folders by uploading a temporary placeholder image
      // Cloudinary automatically creates folders when you upload to a path
      const placeholderBuffer = Buffer.from('placeholder', 'base64');

      // Create avatar folder
      // Upload to avatar folder
        await cloudinary.uploader.upload(`data:text/plain;base64,${placeholderBuffer.toString('base64')}`, {
            folder: `${username}/avatar`,
            public_id: ".placeholder",
            resource_type: "raw",
            overwrite: true,
        });
        
        // Upload to characters folder
        await cloudinary.uploader.upload(`data:text/plain;base64,${placeholderBuffer.toString('base64')}`, {
            folder: `${username}/characters`,
            public_id: ".placeholder",
            resource_type: "raw",
            overwrite: true,
        });
  
      // Clean up placeholder files
      //await cloudinary.uploader.destroy(`${avatarFolder}/.placeholder`, { resource_type: 'raw' });
      //await cloudinary.uploader.destroy(`${charactersFolder}/.placeholder`, { resource_type: 'raw' });

      console.log(`Successfully created folder structure for user: ${username}`);
      return true;
    } catch (error) {
      console.error(`Failed to create Cloudinary folders for user ${username}:`, error);
      return false;
    }
  }

  /**
   * Verifies if the user folder structure exists in Cloudinary
   * @param username - The user's username
   * @returns Promise<boolean> - Whether the folders exist
   */
  static async verifyUserFolders(username: string): Promise<boolean> {
    try {
      // Ensure Cloudinary is configured
      this.ensureConfigured();
      
      const userFolder = username;
      
      // Search for any resources in the user folder
      const result = await cloudinary.search
        .expression(`folder:${userFolder}/*`)
        .max_results(1)
        .execute();

      // If we find any resources, the folder structure exists
      return result.resources.length > 0;
    } catch (error) {
      console.error(`Failed to verify Cloudinary folders for user ${username}:`, error);
      return false;
    }
  }

  /**
   * Gets the folder paths for a user
   * @param username - The user's username
   * @returns Object with folder paths
   */
  static getUserFolderPaths(username: string) {
    const userFolder = username;
    return {
      userFolder,
      avatarFolder: `${userFolder}/avatar`,
      charactersFolder: `${userFolder}/characters`
    };
  }

  /**
   * Cleans up user folder structure (for testing or user deletion)
   * @param username - The user's username
   * @returns Promise<boolean> - Success status
   */
  static async cleanupUserFolders(username: string): Promise<boolean> {
    try {
      console.log(`Cleaning up Cloudinary folders for user: ${username}`);
      
      // Ensure Cloudinary is configured
      this.ensureConfigured();
      
      const userFolder = username;
      
      // Get all resources in the user folder
      const result = await cloudinary.search
        .expression(`folder:${userFolder}/*`)
        .max_results(500) // Adjust as needed
        .execute();

      // Delete all resources
      const publicIds = result.resources.map((resource: any) => resource.public_id);
      
      if (publicIds.length > 0) {
        await cloudinary.api.delete_resources(publicIds);
      }

      // Delete the folders (this happens automatically when empty)
      console.log(`Successfully cleaned up folder structure for user: ${username}`);
      return true;
    } catch (error) {
      console.error(`Failed to cleanup Cloudinary folders for user ${username}:`, error);
      return false;
    }
  }

  /**
   * Migrates user folder structure when username changes
   * @param oldUsername - The old username
   * @param newUsername - The new username
   * @returns Promise<boolean> - Success status
   */
  static async migrateUserFolders(oldUsername: string, newUsername: string): Promise<boolean> {
    try {
      console.log(`Migrating Cloudinary folders from ${oldUsername} to ${newUsername}`);
      
      if (!this.isConfigured()) {
        console.warn('Cloudinary is not configured. Cannot migrate folders.');
        return false;
      }

      // Check if old folder exists
      const oldFoldersExist = await this.verifyUserFolders(oldUsername);
      if (!oldFoldersExist) {
        console.log(`No existing folders found for ${oldUsername}`);
        return true; // Nothing to migrate
      }

      // Get all resources in the old folder
      const result = await cloudinary.search
        .expression(`folder:${oldUsername}/*`)
        .max_results(500)
        .execute();

      // Rename each resource to the new folder structure
      for (const resource of result.resources) {
        const oldPublicId = resource.public_id;
        const newPublicId = oldPublicId.replace(`${oldUsername}/`, `${newUsername}/`);
        
        try {
          await cloudinary.uploader.rename(oldPublicId, newPublicId);
          console.log(`Migrated: ${oldPublicId} -> ${newPublicId}`);
        } catch (renameError) {
          console.error(`Failed to migrate ${oldPublicId}:`, renameError);
        }
      }

      console.log(`Successfully migrated folder structure from ${oldUsername} to ${newUsername}`);
      return true;
    } catch (error) {
      console.error(`Failed to migrate Cloudinary folders from ${oldUsername} to ${newUsername}:`, error);
      return false;
    }
  }

  /**
   * Creates folder structure for a specific character
   * @param username - The user's username
   * @param characterName - The character's name
   * @returns Promise<boolean> - Success status
   */
  static async createCharacterFolders(username: string, characterName: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.warn('Cloudinary is not configured. Please set environment variables.');
        return false;
      }

      this.ensureConfigured();

      const safeName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const characterFolder = `${username}/characters/${safeName}`;
      
      console.log(`Creating character folder structure: ${characterFolder}`);

      const placeholder = Buffer.from('placeholder');
      
      // Create subfolders for character
      const folders = [
        `${characterFolder}/avatar`,
        `${characterFolder}/images`,
        `${characterFolder}/variations`,
        `${characterFolder}/embeddings`,
        `${characterFolder}/generations`
      ];

      for (const folder of folders) {
        await cloudinary.uploader.upload(`data:text/plain;base64,${placeholder.toString('base64')}`, {
          folder: folder,
          public_id: ".placeholder",
          resource_type: "raw",
          overwrite: true,
        });
        console.log(`✅ Created folder: ${folder}`);
      }

      console.log(`Successfully created character folder structure for: ${characterName}`);
      return true;
    } catch (error) {
      console.error(`Failed to create character folders for ${characterName}:`, error);
      return false;
    }
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
   * Upload file to character's specific folder
   * @param username - The user's username
   * @param characterName - The character's name
   * @param fileBuffer - File buffer or base64 data
   * @param fileName - Name for the file
   * @param folderType - Type of folder (avatar, images, variations, embeddings, generations)
   * @returns Promise<{success: boolean, url?: string, publicId?: string, error?: string}>
   */
  static async uploadToCharacterFolder(
    username: string, 
    characterName: string, 
    fileBuffer: Buffer | string, 
    fileName: string,
    folderType: 'avatar' | 'images' | 'variations' | 'embeddings' | 'generations' = 'images'
  ): Promise<{success: boolean, url?: string, publicId?: string, error?: string}> {
    return this.performOptimizedUpload(
      username,
      characterName,
      fileBuffer,
      fileName,
      folderType,
      'character'
    );
  }

  /**
   * Upload file to premade character folder structure
   * @param username - Current user's username (who is generating the image)
   * @param characterName - Character name 
   * @param fileBuffer - File buffer or base64 data
   * @param fileName - Name for the file
   * @param folderType - Type of folder (avatar, images, variations, embeddings, generations)
   * @returns Promise<{success: boolean, url?: string, publicId?: string, error?: string}>
   */
  static async uploadToPremadeCharacterFolder(
    username: string, 
    characterName: string, 
    fileBuffer: Buffer | string, 
    fileName: string,
    folderType: 'avatar' | 'images' | 'variations' | 'embeddings' | 'generations' = 'images'
  ): Promise<{success: boolean, url?: string, publicId?: string, error?: string}> {
    return this.performOptimizedUpload(
      username,
      characterName,
      fileBuffer,
      fileName,
      folderType,
      'premade'
    );
  }

  /**
   * Check if a file already exists in Cloudinary
   * @param publicId - The public ID to check
   * @returns Promise<boolean> - True if exists, false otherwise
   */
  static async fileExists(publicId: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        return false;
      }

      this.ensureConfigured();
      
      await cloudinary.api.resource(publicId);
      return true;
    } catch (error) {
      // File doesn't exist or other error
      return false;
    }
  }

  /**
   * Batch upload multiple files with concurrency control and duplicate checking
   * @param uploads - Array of upload requests
   * @param concurrency - Maximum concurrent uploads (default: 3)
   * @param skipExisting - Skip upload if file already exists (default: true)
   * @param forceOverwrite - Force overwrite existing files even if they exist (default: false)
   * @returns Promise<Array of upload results>
   */
  static async batchUploadToPremadeCharacterFolder(
    uploads: Array<{
      username: string;
      characterName: string;
      fileBuffer: Buffer | string;
      fileName: string;
      folderType?: 'avatar' | 'images' | 'variations' | 'embeddings' | 'generations';
    }>,
    concurrency: number = 3,
    skipExisting: boolean = true,
    forceOverwrite: boolean = false
  ): Promise<Array<{success: boolean, url?: string, publicId?: string, error?: string, fileName: string, skipped?: boolean}>> {
    console.log(`🚀 Starting batch upload of ${uploads.length} files with concurrency ${concurrency}`);
    
    const results: Array<{success: boolean, url?: string, publicId?: string, error?: string, fileName: string, skipped?: boolean}> = [];
    
    // Pre-filter uploads if skipExisting is enabled and not forcing overwrite
    let filteredUploads = uploads;
    if (skipExisting && !forceOverwrite) {
      console.log(`🔍 Checking for existing files...`);
      const existenceChecks = await Promise.allSettled(
        uploads.map(async (upload) => {
          const folders = this.getPremadeCharacterFolderPaths(upload.username, upload.characterName);
          const targetFolder = folders[`${upload.folderType || 'images'}Folder`];
          const publicId = `${targetFolder}/${upload.fileName}`;
          
          const exists = await this.fileExists(publicId);
          return { upload, exists, publicId };
        })
      );
      
      existenceChecks.forEach((check, index) => {
        if (check.status === 'fulfilled' && check.value.exists) {
          results.push({
            success: true,
            fileName: check.value.upload.fileName,
            publicId: check.value.publicId,
            url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${check.value.publicId}`,
            skipped: true
          });
          console.log(`⏭️  Skipping existing file: ${check.value.upload.fileName}`);
        }
      });
      
      filteredUploads = uploads.filter((_, index) => {
        const check = existenceChecks[index];
        return check.status === 'rejected' || !check.value.exists;
      });
      
      console.log(`📋 Upload plan: ${results.length} skipped, ${filteredUploads.length} to upload`);
    } else if (forceOverwrite) {
      console.log(`🔄 Force overwrite enabled - uploading all ${uploads.length} files regardless of existing files`);
      filteredUploads = uploads;
    }
    
    // Process uploads in batches with concurrency control
    for (let i = 0; i < filteredUploads.length; i += concurrency) {
      const batch = filteredUploads.slice(i, i + concurrency);
      
      console.log(`📦 Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(filteredUploads.length / concurrency)} (${batch.length} files)`);
      
      const batchPromises = batch.map(async (upload) => {
        const result = await this.uploadToPremadeCharacterFolder(
          upload.username,
          upload.characterName,
          upload.fileBuffer,
          upload.fileName,
          upload.folderType || 'images'
        );
        
        return {
          ...result,
          fileName: upload.fileName
        };
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process batch results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          if (result.value.success) {
            console.log(`✅ Batch upload ${results.length}/${uploads.length}: ${result.value.fileName} → ${result.value.url}`);
          } else {
            console.error(`❌ Batch upload ${results.length}/${uploads.length}: ${result.value.fileName} → ${result.value.error}`);
          }
        } else {
          const fileName = batch[index].fileName;
          results.push({
            success: false,
            error: result.reason?.message || 'Unknown error',
            fileName
          });
          console.error(`❌ Batch upload ${results.length}/${uploads.length}: ${fileName} → ${result.reason}`);
        }
      });
      
      // Small delay between batches to avoid overwhelming Cloudinary
      if (i + concurrency < filteredUploads.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`🎉 Batch upload completed: ${successCount}/${uploads.length} successful`);
    
    return results;
  }

  /**
   * Optimized upload function with better performance
   */
  private static async performOptimizedUpload(
    username: string,
    characterName: string,
    fileBuffer: Buffer | string,
    fileName: string,
    folderType: 'avatar' | 'images' | 'variations' | 'embeddings' | 'generations' = 'images',
    uploadType: 'character' | 'premade' = 'character'
  ): Promise<{success: boolean, url?: string, publicId?: string, error?: string}> {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Cloudinary not configured' };
      }

      this.ensureConfigured();

      // Get target folder based on upload type
      const folders = uploadType === 'premade' 
        ? this.getPremadeCharacterFolderPaths(username, characterName)
        : this.getCharacterFolderPaths(username, characterName);
      const targetFolder = folders[`${folderType}Folder`];
      
      let uploadData: string;
      let resourceType: 'image' | 'raw' = 'image';

      // Check if this is a text file (like index.txt) based on filename
      const isTextFile = fileName.endsWith('.txt') || fileName.endsWith('.json') || fileName === 'index.txt';

      if (Buffer.isBuffer(fileBuffer)) {
        if (isTextFile || folderType === 'embeddings') {
          // For text files and embeddings, use raw resource type
          resourceType = 'raw';
          uploadData = `data:text/plain;base64,${fileBuffer.toString('base64')}`;
        } else {
          // For image uploads, use optimized base64 encoding
          uploadData = `data:image/png;base64,${fileBuffer.toString('base64')}`;
        }
      } else {
        // String content (like JSON)
        if (folderType === 'embeddings' || isTextFile) {
          resourceType = 'raw';
          // For raw uploads, convert string to base64 data URL
          const buffer = Buffer.from(fileBuffer, 'utf8');
          uploadData = `data:application/json;base64,${buffer.toString('base64')}`;
        } else {
          uploadData = fileBuffer;
        }
      }

      // Optimized upload with better settings for performance
      const result = await cloudinary.uploader.upload(uploadData, {
        folder: targetFolder,
        public_id: fileName,
        resource_type: resourceType,
        overwrite: true,
        // Performance optimizations for faster uploads
        eager_async: false,       // Disable eager transformations
        quality: 85,              // Fixed quality instead of 'auto' for faster processing
        use_filename: false,      // Avoid filename processing overhead
        unique_filename: false,   // Avoid UUID generation overhead
        transformation: [],       // No transformations during upload
        // Keep original format for faster upload (no conversion needed)
        // format: 'webp',        // REMOVED: Format conversion is slow
        // Upload optimization flags
        chunk_size: 3000000,      // 3MB chunks (better for 2MB files)
        timeout: 30000,           // 30 second timeout to fail fast if stuck
      });

      console.log(`✅ Uploaded to ${uploadType} folder ${targetFolder}/${fileName}: ${result.secure_url}`);
      
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (error) {
      console.error(`Failed to upload to ${uploadType} folder:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete character folder and all contents
   * @param username - The user's username
   * @param characterName - The character's name
   * @returns Promise<boolean> - Success status
   */
  static async deleteCharacterFolders(username: string, characterName: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.warn('Cloudinary is not configured. Cannot delete folders.');
        return false;
      }

      this.ensureConfigured();

      const safeName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const characterFolder = `${username}/characters/${safeName}`;
      
      console.log(`Deleting character folder: ${characterFolder}`);

      // Get all resources in the character folder
      const result = await cloudinary.search
        .expression(`folder:${characterFolder}/*`)
        .max_results(500)
        .execute();

      // Delete all resources
      const publicIds = result.resources.map((resource: any) => resource.public_id);
      
      if (publicIds.length > 0) {
        await cloudinary.api.delete_resources(publicIds);
        console.log(`Deleted ${publicIds.length} resources from ${characterFolder}`);
      }

      console.log(`Successfully deleted character folder: ${characterFolder}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete character folder for ${characterName}:`, error);
      return false;
    }
  }

  /**
   * List all characters for a user
   * @param username - The user's username
   * @returns Promise<string[]> - Array of character folder names
   */
  static async listUserCharacters(username: string): Promise<string[]> {
    try {
      if (!this.isConfigured()) {
        console.warn('Cloudinary is not configured.');
        return [];
      }

      this.ensureConfigured();

      const charactersFolder = `${username}/characters`;
      
      // Get all folders in the characters directory
      const result = await cloudinary.api.sub_folders(charactersFolder);
      
      return result.folders.map((folder: any) => folder.name);
    } catch (error) {
      console.error(`Failed to list characters for user ${username}:`, error);
      return [];
    }
  }
}
