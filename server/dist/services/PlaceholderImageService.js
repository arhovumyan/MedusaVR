import { CloudinaryFolderService } from './CloudinaryFolderService.js';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';
export class PlaceholderImageService {
    /**
     * Create a placeholder image when actual generation fails
     */
    static async createPlaceholderImage(options) {
        try {
            console.log(`🖼️ Creating placeholder image for character: ${options.characterName || 'general'}`);
            // Use a placeholder image service like picsum.photos or create a simple colored rectangle
            const placeholderUrl = `https://picsum.photos/${options.width}/${options.height}?random=${Date.now()}`;
            // Download the placeholder image
            const response = await fetch(placeholderUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch placeholder image: ${response.status}`);
            }
            const imageBuffer = Buffer.from(await response.arrayBuffer());
            // Generate sequential filename
            const sanitizedCharacterName = options.characterName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'general';
            const imageNumber = await PlaceholderImageService.getNextImageNumber(options.userId, options.characterName || 'general');
            const paddedImageNumber = imageNumber.toString().padStart(6, '0'); // Format as 000001, 000002, etc.
            const filename = `${sanitizedCharacterName}_image_${paddedImageNumber}`;
            console.log(`📝 Generated placeholder filename: ${filename}`);
            // Upload to Cloudinary
            let uploadResult;
            if (options.characterId && options.characterName) {
                // Upload to character's folder
                uploadResult = await CloudinaryFolderService.uploadToCharacterFolder(options.userId, options.characterName, imageBuffer, filename, 'images');
            }
            else {
                // Upload to character folder with generic name
                uploadResult = await CloudinaryFolderService.uploadToCharacterFolder(options.userId, 'general', imageBuffer, filename, 'images');
            }
            if (!uploadResult.success) {
                throw new Error(`Cloudinary upload failed: ${uploadResult.error}`);
            }
            console.log(`✅ Placeholder image created and uploaded: ${uploadResult.url}`);
            return {
                success: true,
                imageUrl: uploadResult.url,
                imageId: `${sanitizedCharacterName}_image_${imageNumber}`
            };
        }
        catch (error) {
            console.error(`❌ Failed to create placeholder image:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Create a simple text-based placeholder image using local generation
     */
    static async createTextPlaceholder(options) {
        try {
            console.log(`📝 Creating local placeholder for character: ${options.characterName || 'general'}`);
            // Get username from the current user (who is generating the image)
            const currentUserId = options.currentUserId || options.userId;
            const { UserModel } = await import('../db/models/UserModel.js');
            const currentUser = await UserModel.findById(currentUserId);
            if (!currentUser) {
                throw new Error(`Current user not found: ${currentUserId}`);
            }
            const username = currentUser.username;
            // Create a simple base64-encoded placeholder image
            const placeholderBase64 = PlaceholderImageService.getPlaceholderImageBase64();
            const placeholderBuffer = Buffer.from(placeholderBase64, 'base64');
            // Get sequential image number and generate filename with the simplified pattern
            const imageNumber = await PlaceholderImageService.getNextImageNumber(username, options.characterName || 'general', !!options.currentUserId);
            const sanitizedCharacterName = options.characterName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'general';
            const filename = `${username}_${sanitizedCharacterName}_image_${imageNumber}`;
            // Upload to Cloudinary using the appropriate folder structure
            let uploadResult;
            if (options.characterId && options.characterName) {
                if (options.currentUserId) {
                    // Current user generating image from existing character - use premade_characters folder
                    uploadResult = await CloudinaryFolderService.uploadToPremadeCharacterFolder(username, options.characterName, placeholderBuffer, filename, 'images');
                    console.log(`📂 Uploaded placeholder to premade character folder: ${username}/premade_characters/${options.characterName}/images`);
                }
                else {
                    // Character creator uploading - use standard character folder
                    uploadResult = await CloudinaryFolderService.uploadToCharacterFolder(username, options.characterName, placeholderBuffer, filename, 'images');
                    console.log(`📂 Uploaded placeholder to character creator folder: ${username}/characters/${options.characterName}/images`);
                }
            }
            else {
                uploadResult = await CloudinaryFolderService.uploadToCharacterFolder(username, 'general', placeholderBuffer, filename, 'images');
            }
            if (!uploadResult.success) {
                throw new Error(`Cloudinary upload failed: ${uploadResult.error}`);
            }
            console.log(`✅ Local placeholder created and uploaded: ${uploadResult.url}`);
            return {
                success: true,
                imageUrl: uploadResult.url,
                imageId: `${sanitizedCharacterName}_image_${imageNumber}`
            };
        }
        catch (error) {
            console.error(`❌ Failed to create local placeholder:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Returns a base64-encoded placeholder image (simple gray rectangle)
     */
    static getPlaceholderImageBase64() {
        // This is a minimal 100x100 gray PNG image in base64
        return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAYr+eIwAAAABJRU5ErkJggg==';
    }
    /**
     * Create a simple PNG image buffer without external dependencies (DEPRECATED)
     */
    static createSimplePNG(width, height) {
        // Create a minimal PNG with a gradient pattern
        // This is a simple 1x1 pixel PNG that will be stretched
        const pngHeader = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
            0x00, 0x00, 0x00, 0x0D, // IHDR chunk size
            0x49, 0x48, 0x44, 0x52, // IHDR
            0x00, 0x00, 0x00, 0x01, // Width: 1
            0x00, 0x00, 0x00, 0x01, // Height: 1
            0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: 2 (RGB), Compression: 0, Filter: 0, Interlace: 0
            0x90, 0x77, 0x53, 0xDE, // CRC
            0x00, 0x00, 0x00, 0x0C, // IDAT chunk size
            0x49, 0x44, 0x41, 0x54, // IDAT
            0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Compressed data
            0xE5, 0x27, 0xDE, 0xFC, // CRC
            0x00, 0x00, 0x00, 0x00, // IEND chunk size
            0x49, 0x45, 0x4E, 0x44, // IEND
            0xAE, 0x42, 0x60, 0x82 // CRC
        ]);
        return pngHeader;
    }
    /**
     * Create a simple text-based placeholder image (DEPRECATED - use createTextPlaceholder)
     */
    static async createExternalTextPlaceholder(options) {
        try {
            console.log(`📝 Creating text placeholder for: ${options.prompt?.substring(0, 50)}...`);
            // Use a text-to-image placeholder service
            const text = encodeURIComponent(options.prompt?.substring(0, 100) || 'Image Generation Failed');
            const placeholderUrl = `https://via.placeholder.com/${options.width}x${options.height}/cccccc/333333?text=${text}`;
            const response = await fetch(placeholderUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch text placeholder: ${response.status}`);
            }
            const imageBuffer = Buffer.from(await response.arrayBuffer());
            const timestamp = Date.now();
            const sanitizedCharacterName = options.characterName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'general';
            const filename = `text_placeholder_${sanitizedCharacterName}_${timestamp}`;
            // Upload to Cloudinary
            let uploadResult;
            if (options.characterId && options.characterName) {
                uploadResult = await CloudinaryFolderService.uploadToCharacterFolder(options.userId, options.characterName, imageBuffer, filename, 'images');
            }
            else {
                uploadResult = await CloudinaryFolderService.uploadToCharacterFolder(options.userId, 'general', imageBuffer, filename, 'images');
            }
            if (!uploadResult.success) {
                throw new Error(`Cloudinary upload failed: ${uploadResult.error}`);
            }
            console.log(`✅ Text placeholder created and uploaded: ${uploadResult.url}`);
            return {
                success: true,
                imageUrl: uploadResult.url,
                imageId: `text_placeholder_${timestamp}`
            };
        }
        catch (error) {
            console.error(`❌ Failed to create text placeholder:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Get the next sequential image number for a character
     */
    static async getNextImageNumber(username, characterName, isPremadeCharacter = false) {
        try {
            console.log(`🔢 Getting next image number for character: ${characterName}`);
            // Get all images from Cloudinary for this character using the appropriate folder structure
            const sanitizedCharacterName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const folderPath = isPremadeCharacter
                ? `${username}/premade_characters/${sanitizedCharacterName}/images`
                : `${username}/characters/${sanitizedCharacterName}/images`;
            // Search for images with the new simplified naming pattern: username_charactername_image_*
            const searchPattern = `${username}_${sanitizedCharacterName}_image_*`;
            const searchResult = await cloudinary.search
                .expression(`folder:${folderPath} AND public_id:${searchPattern}`)
                .sort_by('created_at', 'desc')
                .max_results(500)
                .execute();
            console.log(`📊 Found ${searchResult.resources.length} existing images for ${characterName}`);
            // Extract image numbers from existing files with the new naming pattern
            const imageNumbers = [];
            for (const resource of searchResult.resources) {
                const publicId = resource.public_id;
                // Match pattern: username_charactername_image_NUMBER
                const match = publicId.match(new RegExp(`${username}_${sanitizedCharacterName}_image_(\\d+)$`));
                if (match) {
                    imageNumbers.push(parseInt(match[1], 10));
                }
            }
            // Get the next number (highest + 1, or 1 if no images exist)
            const nextNumber = imageNumbers.length > 0 ? Math.max(...imageNumbers) + 1 : 1;
            console.log(`🎯 Next image number for ${characterName}: ${nextNumber}`);
            return nextNumber;
        }
        catch (error) {
            console.error(`❌ Error getting next image number:`, error);
            // Fallback to timestamp-based numbering if Cloudinary query fails
            return Date.now() % 10000; // Use last 4 digits of timestamp as fallback
        }
    }
    /**
     * Public method to get the next image number for a character
     * Used by other services to ensure consistent numbering
     */
    static async getNextImageNumberPublic(username, characterName, isPremadeCharacter = false) {
        return this.getNextImageNumber(username, characterName, isPremadeCharacter);
    }
    /**
     * Create multiple placeholder images for batch generation
     */
    static async createBatchPlaceholders(options) {
        const quantity = options.quantity || 1;
        try {
            console.log(`🎨 Creating ${quantity} placeholder image(s) for character: ${options.characterName || 'general'}`);
            // Create multiple placeholders concurrently
            const placeholderPromises = [];
            for (let i = 0; i < quantity; i++) {
                placeholderPromises.push(this.createSinglePlaceholder(options, i + 1));
            }
            console.log(`🚀 Starting creation of ${quantity} placeholders...`);
            const placeholderUrls = await Promise.allSettled(placeholderPromises);
            // Process results
            const successfulPlaceholders = [];
            const errors = [];
            placeholderUrls.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successfulPlaceholders.push(result.value);
                    console.log(`✅ Placeholder ${index + 1}/${quantity} created successfully`);
                }
                else {
                    errors.push(`Placeholder ${index + 1}: ${result.reason}`);
                    console.error(`❌ Placeholder ${index + 1}/${quantity} failed:`, result.reason);
                }
            });
            if (successfulPlaceholders.length === 0) {
                throw new Error(`All placeholder generations failed: ${errors.join(', ')}`);
            }
            console.log(`🎉 Batch placeholder creation completed! Success: ${successfulPlaceholders.length}/${quantity}`);
            return {
                success: true,
                imageUrls: successfulPlaceholders,
                imageUrl: successfulPlaceholders[0], // First image for backward compatibility
                generatedCount: successfulPlaceholders.length
            };
        }
        catch (error) {
            console.error(`❌ Batch placeholder creation failed:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                generatedCount: 0
            };
        }
    }
    /**
     * Create a single placeholder image (used for batch creation)
     */
    static async createSinglePlaceholder(options, imageIndex) {
        try {
            console.log(`🖼️ Creating placeholder ${imageIndex} for ${options.characterName || 'general'}`);
            // Get username from the current user (who is generating the image)
            const currentUserId = options.currentUserId || options.userId;
            const { UserModel } = await import('../db/models/UserModel.js');
            const currentUser = await UserModel.findById(currentUserId);
            if (!currentUser) {
                throw new Error(`Current user not found: ${currentUserId}`);
            }
            const username = currentUser.username;
            // Create a simple base64-encoded placeholder image
            const placeholderBase64 = this.getPlaceholderImageBase64();
            const placeholderBuffer = Buffer.from(placeholderBase64, 'base64');
            // Get sequential image number and generate filename with the simplified pattern
            const imageNumber = await this.getNextImageNumber(username, options.characterName || 'general', !!options.currentUserId);
            const sanitizedCharacterName = options.characterName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'general';
            const actualImageNumber = imageNumber + imageIndex - 1; // Calculate actual image number for this batch
            const filename = `${username}_${sanitizedCharacterName}_image_${actualImageNumber}`;
            // Upload to Cloudinary using the appropriate folder structure
            let uploadResult;
            if (options.characterId && options.characterName) {
                if (options.currentUserId) {
                    // Current user generating image from existing character - use premade_characters folder
                    uploadResult = await CloudinaryFolderService.uploadToPremadeCharacterFolder(username, options.characterName, placeholderBuffer, filename, 'images');
                    console.log(`📂 Uploaded placeholder ${imageIndex} to premade character folder: ${username}/premade_characters/${options.characterName}/images`);
                }
                else {
                    // Character creator uploading - use standard character folder
                    uploadResult = await CloudinaryFolderService.uploadToCharacterFolder(username, options.characterName, placeholderBuffer, filename, 'images');
                    console.log(`📂 Uploaded placeholder ${imageIndex} to character creator folder: ${username}/characters/${options.characterName}/images`);
                }
            }
            else {
                uploadResult = await CloudinaryFolderService.uploadToCharacterFolder(username, 'general', placeholderBuffer, filename, 'images');
            }
            if (!uploadResult.success) {
                throw new Error(`Cloudinary upload failed for placeholder ${imageIndex}: ${uploadResult.error}`);
            }
            console.log(`✅ Placeholder ${imageIndex} uploaded to Cloudinary: ${uploadResult.url}`);
            return uploadResult.url;
        }
        catch (error) {
            console.error(`❌ Failed to create placeholder ${imageIndex}:`, error);
            throw error;
        }
    }
}
