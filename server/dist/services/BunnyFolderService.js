import { BunnyStorageService } from './BunnyStorageService.js';
import { ImageIndexService } from './ImageIndexService.js';
/**
 * Bunny CDN Folder Service
 * Manages folder structure and operations for Bunny CDN, replacing CloudinaryFolderService
 * Maintains the same folder structure as the original Cloudinary implementation
 */
export class BunnyFolderService {
    /**
     * Check if Bunny CDN is configured
     */
    static isConfigured() {
        return BunnyStorageService.isConfigured();
    }
    /**
     * Ensure Bunny CDN is configured
     */
    static ensureConfigured() {
        BunnyStorageService.ensureConfigured();
    }
    /**
     * Creates the folder structure for a new user in Bunny CDN
     * @param username - The user's username
     * @returns Promise<boolean> - Success status
     */
    static async createUserFolders(username) {
        try {
            if (!this.isConfigured()) {
                console.warn('Bunny CDN is not configured. Please set BUNNY_ACCESS_KEY environment variable.');
                return false;
            }
            this.ensureConfigured();
            console.log(`Creating Bunny CDN folder structure for user: ${username}`);
            // Create main user folders
            const folders = [
                `${username}/avatar`,
                `${username}/characters`,
                `${username}/premade_characters`
            ];
            for (const folder of folders) {
                const result = await BunnyStorageService.createDirectory(folder);
                if (!result.success) {
                    console.error(`Failed to create folder: ${folder}`, result.error);
                    return false;
                }
            }
            console.log(`Successfully created folder structure for user: ${username}`);
            return true;
        }
        catch (error) {
            console.error(`Failed to create Bunny CDN folders for user ${username}:`, error);
            return false;
        }
    }
    /**
     * Cleans up user folder structure (for testing or user deletion)
     * @param username - The user's username
     * @returns Promise<boolean> - Success status
     */
    static async cleanupUserFolders(username) {
        try {
            this.ensureConfigured();
            // List and delete all files in user's folders
            const folders = [
                `${username}/avatar`,
                `${username}/characters`,
                `${username}/premade_characters`
            ];
            for (const folder of folders) {
                const listResult = await BunnyStorageService.listFiles(folder);
                if (listResult.success && listResult.files) {
                    for (const file of listResult.files) {
                        await BunnyStorageService.deleteFile(`${folder}/${file}`);
                    }
                }
                // Delete the placeholder file as well
                await BunnyStorageService.deleteFile(`${folder}/.placeholder`);
            }
            console.log(`Successfully cleaned up folders for user: ${username}`);
            return true;
        }
        catch (error) {
            console.error(`Failed to cleanup folders for user ${username}:`, error);
            return false;
        }
    }
    /**
     * Migrates user folder structure when username changes
     * @param oldUsername - The old username
     * @param newUsername - The new username
     * @returns Promise<boolean> - Success status
     */
    static async migrateUserFolders(oldUsername, newUsername) {
        try {
            this.ensureConfigured();
            // For Bunny CDN, we would need to copy files and delete old ones
            // This is more complex and would require listing all files and re-uploading
            console.warn('Username migration for Bunny CDN is not implemented yet');
            return false;
        }
        catch (error) {
            console.error(`Failed to migrate folders from ${oldUsername} to ${newUsername}:`, error);
            return false;
        }
    }
    /**
     * Creates folder structure for a specific character
     * @param username - The user's username
     * @param characterName - The character's name
     * @returns Promise<boolean> - Success status
     */
    static async createCharacterFolders(username, characterName) {
        try {
            if (!this.isConfigured()) {
                console.warn('Bunny CDN is not configured. Please set environment variables.');
                return false;
            }
            this.ensureConfigured();
            // Use character name as-is to match folder structure
            const characterFolder = `${username}/characters/${characterName}`;
            console.log(`Creating character folder structure: ${characterFolder}`);
            // Create subfolders for character
            const folders = [
                `${characterFolder}/avatar`,
                `${characterFolder}/images`,
                `${characterFolder}/variations`,
                `${characterFolder}/embeddings`,
                `${characterFolder}/generations`
            ];
            for (const folder of folders) {
                const result = await BunnyStorageService.createDirectory(folder);
                if (!result.success) {
                    console.error(`Failed to create folder: ${folder}`, result.error);
                    return false;
                }
                console.log(`✅ Created folder: ${folder}`);
            }
            console.log(`Successfully created character folder structure for: ${characterName}`);
            return true;
        }
        catch (error) {
            console.error(`Failed to create character folders for ${characterName}:`, error);
            return false;
        }
    }
    /**
     * Get folder paths for character folders (original structure for character creation)
     */
    static getCharacterFolderPaths(username, characterName) {
        // Use the character name as-is to match the folder structure in Bunny CDN
        // No need to sanitize since we want exact folder matching
        // For general images (no specific character), use a 'general' folder  
        const isGeneral = characterName === 'general';
        const baseFolder = isGeneral
            ? `${username}/images`
            : `${username}/characters/${characterName}`;
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
    static getPremadeCharacterFolderPaths(username, characterName) {
        // Use character name as-is to match folder structure
        const baseFolder = `${username}/premade_characters/${characterName}`;
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
    static async uploadToCharacterFolder(username, characterName, fileBuffer, fileName, folderType = 'images') {
        return this.performOptimizedUpload(username, characterName, fileBuffer, fileName, folderType, 'character');
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
    static async uploadToPremadeCharacterFolder(username, characterName, fileBuffer, fileName, folderType = 'images') {
        return this.performOptimizedUpload(username, characterName, fileBuffer, fileName, folderType, 'premade');
    }
    /**
     * Upload image to premade character folder with automatic indexing and naming
     * This method handles the full flow: folder creation, index tracking, and file upload
     * @param username - Current user's username (who is generating the image)
     * @param characterName - Character name
     * @param fileBuffer - File buffer or base64 data
     * @returns Promise<{success: boolean, url?: string, publicId?: string, fileName?: string, imageNumber?: number, error?: string}>
     */
    static async uploadPremadeCharacterImageWithIndexing(username, characterName, fileBuffer) {
        try {
            console.log(`🎨 Starting indexed image upload for ${username}/${characterName}`);
            // Ensure the folder structure exists
            const folderCreated = await ImageIndexService.ensurePremadeCharacterFolderStructure(username, characterName);
            if (!folderCreated) {
                return {
                    success: false,
                    error: 'Failed to create/ensure folder structure'
                };
            }
            // Get the next image number
            const imageNumber = await ImageIndexService.getNextImageNumber(username, characterName);
            // Generate the filename using the correct naming convention
            const fileName = ImageIndexService.generateImageFilename(username, characterName, imageNumber);
            console.log(`📸 Generated indexed filename: ${fileName} (image #${imageNumber})`);
            // Upload the file using the existing premade character folder upload method
            const uploadResult = await this.uploadToPremadeCharacterFolder(username, characterName, fileBuffer, fileName, 'images');
            if (uploadResult.success) {
                console.log(`✅ Successfully uploaded indexed image: ${fileName}`);
                return {
                    ...uploadResult,
                    fileName,
                    imageNumber
                };
            }
            else {
                console.error(`❌ Failed to upload indexed image: ${uploadResult.error}`);
                return uploadResult;
            }
        }
        catch (error) {
            console.error(`❌ Error in indexed image upload for ${username}/${characterName}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown upload error'
            };
        }
    }
    /**
     * Batch upload multiple files with concurrency control and duplicate checking
     * @param uploads - Array of upload requests
     * @param concurrency - Maximum concurrent uploads (default: 2 for better reliability)
     * @param skipExisting - Skip upload if file already exists (default: true)
     * @param forceOverwrite - Force overwrite existing files even if they exist (default: false)
     * @returns Promise<Array of upload results>
     */
    static async batchUploadToPremadeCharacterFolder(uploads, concurrency = 2, // Reduced default concurrency for better reliability
    skipExisting = true, forceOverwrite = false) {
        console.log(`📦 Starting batch upload of ${uploads.length} files to Bunny CDN`);
        console.log(`⚙️ Settings: concurrency=${concurrency}, skipExisting=${skipExisting}, forceOverwrite=${forceOverwrite}`);
        let filteredUploads = uploads;
        // Check for existing files if skipExisting is enabled and not force overwriting
        if (skipExisting && !forceOverwrite) {
            console.log(`🔍 Checking for existing files...`);
            filteredUploads = [];
            for (const upload of uploads) {
                try {
                    const folders = this.getPremadeCharacterFolderPaths(upload.username, upload.characterName);
                    const targetFolder = folders[`${upload.folderType || 'images'}Folder`];
                    // For Bunny CDN, we'll try to list files to check existence
                    // This is simpler than trying to fetch each individual file
                    const listResult = await BunnyStorageService.listFiles(targetFolder);
                    if (listResult.success && listResult.files && listResult.files.includes(upload.fileName)) {
                        console.log(`⏭️ Skipping existing file: ${upload.fileName}`);
                        continue;
                    }
                    filteredUploads.push(upload);
                }
                catch (error) {
                    console.warn(`⚠️ Error checking existing file ${upload.fileName}, including in upload:`, error);
                    filteredUploads.push(upload); // Include if check fails
                }
            }
            console.log(`📊 ${uploads.length - filteredUploads.length} files already exist, ${filteredUploads.length} files to upload`);
        }
        else if (forceOverwrite) {
            console.log(`🔄 Force overwrite enabled - uploading all ${uploads.length} files regardless of existing files`);
            filteredUploads = uploads;
        }
        // Process uploads in batches with concurrency control
        const results = [];
        for (let i = 0; i < filteredUploads.length; i += concurrency) {
            const batch = filteredUploads.slice(i, i + concurrency);
            console.log(`📦 Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(filteredUploads.length / concurrency)} (${batch.length} files)`);
            const batchPromises = batch.map(async (upload, batchIndex) => {
                try {
                    // Add a small staggered delay to avoid simultaneous requests
                    if (batchIndex > 0) {
                        await new Promise(resolve => setTimeout(resolve, batchIndex * 200));
                    }
                    const result = await this.uploadToPremadeCharacterFolder(upload.username, upload.characterName, upload.fileBuffer, upload.fileName, upload.folderType || 'images');
                    return {
                        ...result,
                        fileName: upload.fileName
                    };
                }
                catch (error) {
                    console.error(`❌ Error uploading ${upload.fileName}:`, error);
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown upload error',
                        fileName: upload.fileName
                    };
                }
            });
            const batchResults = await Promise.allSettled(batchPromises);
            // Process batch results
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    results.push({
                        success: false,
                        error: result.reason?.message || 'Unknown error',
                        fileName: 'unknown'
                    });
                }
            }
            // Log batch progress
            const batchSuccessful = batchResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
            console.log(`✅ Batch completed: ${batchSuccessful}/${batch.length} successful`);
            // Longer delay between batches to avoid overwhelming the API
            if (i + concurrency < filteredUploads.length) {
                console.log('⏳ Waiting between batches...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        // Add skipped files to results
        const skippedCount = uploads.length - filteredUploads.length;
        for (let i = 0; i < skippedCount; i++) {
            const skippedUpload = uploads.find(u => !filteredUploads.some(fu => fu.fileName === u.fileName));
            if (skippedUpload) {
                results.push({
                    success: true,
                    fileName: skippedUpload.fileName,
                    skipped: true
                });
            }
        }
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        const skipped = results.filter(r => r.skipped).length;
        console.log(`📊 Batch upload completed: ${successful} successful, ${failed} failed, ${skipped} skipped`);
        return results;
    }
    /**
     * Optimized upload function with better performance and error handling
     */
    static async performOptimizedUpload(username, characterName, fileBuffer, fileName, folderType = 'images', uploadType = 'character') {
        try {
            if (!this.isConfigured()) {
                return { success: false, error: 'Bunny CDN not configured' };
            }
            this.ensureConfigured();
            // Get target folder based on upload type
            const folders = uploadType === 'premade'
                ? this.getPremadeCharacterFolderPaths(username, characterName)
                : this.getCharacterFolderPaths(username, characterName);
            const targetFolder = folders[`${folderType}Folder`];
            // Construct full file path
            const filePath = `${targetFolder}/${fileName}`;
            console.log(`📤 Starting ${uploadType} upload: ${fileName} to ${targetFolder}`);
            let uploadResult;
            if (typeof fileBuffer === 'string') {
                // Handle base64 data
                if (fileBuffer.startsWith('data:')) {
                    uploadResult = await BunnyStorageService.uploadBase64(filePath, fileBuffer);
                }
                else {
                    // Treat as base64 without data URL prefix
                    const mimeType = BunnyStorageService.getMimeType(fileName);
                    const dataUrl = `data:${mimeType};base64,${fileBuffer}`;
                    uploadResult = await BunnyStorageService.uploadBase64(filePath, dataUrl);
                }
            }
            else {
                // Handle Buffer
                const mimeType = BunnyStorageService.getMimeType(fileName);
                uploadResult = await BunnyStorageService.uploadFile(filePath, fileBuffer, mimeType);
            }
            if (!uploadResult.success) {
                console.error(`❌ ${uploadType} upload failed for ${fileName}:`, uploadResult.error);
                return {
                    success: false,
                    error: uploadResult.error
                };
            }
            console.log(`✅ Successfully uploaded to ${uploadType} folder: ${uploadResult.url}`);
            return {
                success: true,
                url: uploadResult.url,
                publicId: filePath // Use the file path as the public ID
            };
        }
        catch (error) {
            console.error(`❌ Error uploading to ${uploadType} folder:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown upload error'
            };
        }
    }
    /**
     * Delete character folder and all contents
     * @param username - The user's username
     * @param characterName - The character's name
     * @returns Promise<boolean> - Success status
     */
    static async deleteCharacterFolders(username, characterName) {
        try {
            this.ensureConfigured();
            const safeName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const characterFolder = `${username}/characters/${safeName}`;
            // List all files in the character folder and delete them
            const folders = [
                `${characterFolder}/avatar`,
                `${characterFolder}/images`,
                `${characterFolder}/variations`,
                `${characterFolder}/embeddings`,
                `${characterFolder}/generations`
            ];
            for (const folder of folders) {
                const listResult = await BunnyStorageService.listFiles(folder);
                if (listResult.success && listResult.files) {
                    for (const file of listResult.files) {
                        await BunnyStorageService.deleteFile(`${folder}/${file}`);
                    }
                }
                // Delete placeholder
                await BunnyStorageService.deleteFile(`${folder}/.placeholder`);
            }
            console.log(`Successfully deleted character folder: ${characterFolder}`);
            return true;
        }
        catch (error) {
            console.error(`Failed to delete character folders for ${characterName}:`, error);
            return false;
        }
    }
    /**
     * List all characters for a user
     * @param username - The user's username
     * @returns Promise<string[]> - Array of character folder names
     */
    static async listUserCharacters(username) {
        try {
            this.ensureConfigured();
            const charactersFolder = `${username}/characters`;
            // For Bunny CDN, we need to implement directory listing logic
            // This is a simplified version - in practice, you might need to track this differently
            const listResult = await BunnyStorageService.listFiles(charactersFolder);
            if (!listResult.success) {
                return [];
            }
            // Extract character names from file paths
            const characterNames = new Set();
            if (listResult.files) {
                for (const file of listResult.files) {
                    const parts = file.split('/');
                    if (parts.length > 0 && parts[0] !== '.placeholder') {
                        characterNames.add(parts[0]);
                    }
                }
            }
            return Array.from(characterNames);
        }
        catch (error) {
            console.error(`Failed to list characters for user ${username}:`, error);
            return [];
        }
    }
}
