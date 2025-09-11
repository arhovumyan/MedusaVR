import runPodService from './RunPodService.js';
import CharacterGenerationService from './CharacterGenerationService.js';
import { BunnyFolderService } from './BunnyFolderService.js';
import { BunnyStorageService } from './BunnyStorageService.js';
export class CharacterImageService {
    /**
     * Generate character avatar using consistent generation approach
     */
    static async generateCharacterAvatar(characterData, userId, username) {
        try {
            console.log('🎨 Starting character avatar generation...');
            console.log('📋 Input character data:', JSON.stringify(characterData, null, 2));
            // Extract art style (default to 'anime' if not provided)
            const artStyle = characterData.artStyle?.primaryStyle || 'anime';
            console.log(`🎯 Art style selected: ${artStyle}`);
            // Use the new CharacterGenerationService for consistent generation
            const generationOptions = {
                characterName: characterData.name,
                description: characterData.description,
                artStyle: artStyle,
                selectedTags: characterData.selectedTags,
                width: 512,
                height: 768,
                steps: 20, // Match curl settings
                cfgScale: 8, // Match curl settings
                userId: userId,
                username: username
            };
            console.log('🔧 Generation options:', JSON.stringify(generationOptions, null, 2));
            const generationResult = await CharacterGenerationService.generateConsistentAvatar(generationOptions);
            console.log('📊 Generation result summary:', {
                success: generationResult.success,
                hasImageUrl: !!generationResult.imageUrl,
                error: generationResult.error,
                characterSeed: generationResult.characterSeed,
                seed: generationResult.seed
            });
            if (!generationResult.success) {
                console.error('❌ Character generation failed:', generationResult.error);
                return {
                    success: false,
                    error: generationResult.error || 'Failed to generate character image'
                };
            }
            console.log('✅ Image generation successful, proceeding to Bunny CDN upload...');
            // Upload to Bunny CDN with user folder structure
            const uploadResult = await this.uploadUrlToBunny(generationResult.imageUrl, username, characterData.name);
            if (!uploadResult.success) {
                console.error('❌ Bunny CDN upload failed:', uploadResult.error);
                return {
                    success: false,
                    error: uploadResult.error || 'Failed to upload generated image'
                };
            }
            console.log('✅ Character avatar generation and upload successful!');
            return {
                success: true,
                imageUrl: uploadResult.imageUrl,
                generationData: {
                    ...generationResult.generationData,
                    bunnyPublicId: uploadResult.publicId,
                    originalGeneratedUrl: generationResult.imageUrl,
                    characterSeed: generationResult.characterSeed,
                    generationSeed: generationResult.seed
                }
            };
        }
        catch (error) {
            console.error('❌ Character avatar generation error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during avatar generation'
            };
        }
    }
    /**
     * Generate character variation (face, body, outfit) for existing character
     */
    static async generateCharacterVariation(characterId, characterSeed, variationType, characterData, userId, username) {
        try {
            console.log(`🎭 Generating ${variationType} variation for character ${characterId}...`);
            const artStyle = characterData.artStyle?.primaryStyle || 'anime';
            const generationOptions = {
                characterName: characterData.name,
                description: characterData.description,
                artStyle: artStyle,
                selectedTags: characterData.selectedTags,
                width: 512,
                height: 768,
                userId: userId,
                username: username
            };
            const variationResult = await CharacterGenerationService.generateCharacterVariation(characterSeed, variationType, generationOptions);
            if (!variationResult.success) {
                return {
                    success: false,
                    error: variationResult.error || 'Failed to generate character variation'
                };
            }
            // Upload variation to Bunny CDN
            const uploadResult = await this.uploadUrlToBunny(variationResult.imageUrl, username, `${characterData.name}_${variationType}`);
            if (!uploadResult.success) {
                return {
                    success: false,
                    error: uploadResult.error || 'Failed to upload variation image'
                };
            }
            console.log(`✅ Character ${variationType} variation generated successfully!`);
            return {
                success: true,
                imageUrl: uploadResult.imageUrl,
                generationData: {
                    ...variationResult.generationData,
                    bunnyPublicId: uploadResult.publicId,
                    originalGeneratedUrl: variationResult.imageUrl,
                    variationType: variationType
                }
            };
        }
        catch (error) {
            console.error(`❌ Character ${variationType} variation error:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during variation generation'
            };
        }
    }
    /**
     * Upload image from URL to Bunny CDN
     */
    static async uploadUrlToBunny(imageUrl, username, characterName) {
        try {
            // Download the image first
            console.log(`📥 Downloading image from URL: ${imageUrl.substring(0, 100)}...`);
            let imageBuffer;
            if (imageUrl.startsWith('data:image/')) {
                // It's a base64 data URL
                const base64Data = imageUrl.split(',')[1];
                if (!base64Data) {
                    return {
                        success: false,
                        error: 'Invalid base64 data URL format'
                    };
                }
                imageBuffer = Buffer.from(base64Data, 'base64');
            }
            else {
                // It's a regular URL, download it
                const response = await fetch(imageUrl);
                if (!response.ok) {
                    return {
                        success: false,
                        error: `Failed to download image: ${response.status} ${response.statusText}`
                    };
                }
                const arrayBuffer = await response.arrayBuffer();
                imageBuffer = Buffer.from(arrayBuffer);
            }
            // Generate filename with timestamp
            const timestamp = Date.now();
            const safeName = characterName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const fileName = `character_${safeName}_${timestamp}.png`;
            // Upload to Bunny CDN using BunnyFolderService
            const uploadResult = await BunnyFolderService.uploadToCharacterFolder(username, characterName, imageBuffer, fileName, 'images');
            if (!uploadResult.success) {
                return {
                    success: false,
                    error: uploadResult.error
                };
            }
            console.log(`✅ Successfully uploaded to Bunny CDN: ${uploadResult.url}`);
            return {
                success: true,
                imageUrl: uploadResult.url,
                publicId: uploadResult.publicId
            };
        }
        catch (error) {
            console.error('❌ Bunny CDN URL upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown Bunny CDN upload error'
            };
        }
    }
    /**
     * Upload image buffer to Bunny CDN
     */
    static async uploadToBunny(imageBuffer, username, characterName) {
        try {
            // Generate filename with timestamp
            const timestamp = Date.now();
            const safeName = characterName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const fileName = `character_${safeName}_${timestamp}.png`;
            // Upload to Bunny CDN using BunnyFolderService
            const uploadResult = await BunnyFolderService.uploadToCharacterFolder(username, characterName, imageBuffer, fileName, 'images');
            if (!uploadResult.success) {
                return {
                    success: false,
                    error: uploadResult.error
                };
            }
            return {
                success: true,
                imageUrl: uploadResult.url,
                publicId: uploadResult.publicId
            };
        }
        catch (error) {
            console.error('Bunny CDN upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown Bunny CDN error'
            };
        }
    }
    /**
     * Generate fallback placeholder image URL
     */
    static generatePlaceholderImage(characterName, artStyle) {
        // Use local placeholder image instead of external service
        return '/placeholder-character.png';
    }
    /**
     * Check if an image generation is likely to succeed
     */
    static async checkGenerationViability() {
        // Check RunPod availability
        if (!runPodService.isAvailable()) {
            return {
                viable: false,
                reason: 'RunPod service not configured (RUNPOD_WEBUI_URL not set)'
            };
        }
        // Check RunPod health
        const isHealthy = await runPodService.healthCheck();
        if (!isHealthy) {
            return {
                viable: false,
                reason: 'RunPod service not responding'
            };
        }
        // Check Bunny CDN configuration
        if (!BunnyStorageService.isConfigured()) {
            return {
                viable: false,
                reason: 'Bunny CDN not configured'
            };
        }
        return {
            viable: true
        };
    }
    /**
     * Generate additional images for an existing character (for consistency)
     */
    static async generateAdditionalImage(characterId, originalPrompt, originalSeed, newContext = '', username) {
        try {
            console.log(`🎨 Generating additional image for character ${characterId}...`);
            // Build consistent prompt
            const consistentPromptData = {
                prompt: originalPrompt,
                negativePrompt: 'worst quality, low quality, blurry, bad anatomy, extra limbs',
                model: 'ILustMix.safetensors', // Use default model for consistency
                seed: originalSeed, // Use same seed for consistency
                steps: 20,
                cfgScale: 8,
                width: 768,
                height: 1152,
                sampler: 'Euler a',
                enableHr: true,
                hrUpscaler: 'Latent',
                hrScale: 2,
                denoisingStrength: 0.4
            };
            // Use existing image generation logic with consistent prompt
            const imageGenParams = {
                prompt: consistentPromptData.prompt,
                negativePrompt: 'worst quality, low quality, blurry, bad anatomy, extra limbs',
                model: 'ILustMix.safetensors', // Use default model for consistency
                width: 768,
                height: 1152,
                steps: 20,
                cfgScale: 8,
                seed: consistentPromptData.seed, // Use same seed for consistency
                sampler: 'Euler a',
                enableHr: true,
                hrUpscaler: 'Latent',
                hrScale: 2,
                denoisingStrength: 0.4
            };
            const generationResult = await runPodService.generateImage(imageGenParams);
            if (!generationResult.success) {
                return {
                    success: false,
                    error: generationResult.error
                };
            }
            // Upload to Bunny CDN
            const base64Image = generationResult.imageUrl?.replace('data:image/png;base64,', '') || '';
            const imageBuffer = Buffer.from(base64Image, 'base64');
            const uploadResult = await this.uploadToBunny(imageBuffer, username, `character_${characterId}_additional`);
            if (!uploadResult.success) {
                return {
                    success: false,
                    error: uploadResult.error
                };
            }
            return {
                success: true,
                imageUrl: uploadResult.imageUrl,
                cloudinaryPublicId: uploadResult.publicId,
                prompt: consistentPromptData.prompt,
                negativePrompt: imageGenParams.negativePrompt,
                model: imageGenParams.model,
                seed: consistentPromptData.seed,
                generationData: {
                    prompt: consistentPromptData.prompt,
                    negativePrompt: imageGenParams.negativePrompt,
                    model: imageGenParams.model,
                    seed: consistentPromptData.seed,
                    steps: imageGenParams.steps,
                    cfgScale: imageGenParams.cfgScale,
                    width: imageGenParams.width,
                    height: imageGenParams.height,
                    generationTime: new Date()
                }
            };
        }
        catch (error) {
            console.error('❌ Additional image generation error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Generate a character-specific seed for consistency
     */
    static generateCharacterSeed(characterName, description) {
        const combined = `${characterName}_${description}`.toLowerCase();
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return Math.abs(hash) % 2147483647;
    }
    /**
     * Generate additional images using img2img for character consistency
     * This uses the character's existing image as a base for new variations
     */
    static async generateCharacterConsistentImage(characterId, baseImageUrl, // Existing character image URL
    newPrompt, characterData, userId, username, denoisingStrength = 0.2 // Lower = more similar to original
    ) {
        try {
            console.log('🎭 Generating consistent character image using img2img...');
            console.log('📋 Base image URL:', baseImageUrl.substring(0, 100) + '...');
            console.log('📝 New prompt:', newPrompt);
            // Download the base image and convert to base64
            let baseImageBase64;
            if (baseImageUrl.startsWith('data:image')) {
                // Already a data URL, extract base64
                baseImageBase64 = baseImageUrl.split(',')[1];
            }
            else {
                // Download image from URL and convert to base64
                try {
                    const imageResponse = await fetch(baseImageUrl);
                    if (!imageResponse.ok) {
                        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
                    }
                    const imageArrayBuffer = await imageResponse.arrayBuffer();
                    const imageBuffer = Buffer.from(imageArrayBuffer);
                    baseImageBase64 = imageBuffer.toString('base64');
                }
                catch (error) {
                    console.error('❌ Failed to download base image:', error);
                    return {
                        success: false,
                        error: 'Failed to download base character image for consistency'
                    };
                }
            }
            // Generate with img2img
            const artStyle = characterData.artStyle?.primaryStyle || 'anime';
            const imageResult = await runPodService.generateImageImg2Img({
                initImages: [baseImageBase64],
                prompt: newPrompt,
                negativePrompt: this.buildNegativePrompt(artStyle),
                width: 512,
                height: 768,
                steps: 25, // High quality steps
                cfgScale: 8,
                sampler: 'Euler a',
                enableHr: true, // Enable high-res fix
                hrUpscaler: 'Latent',
                denoisingStrength,
                artStyle,
                characterData: {
                    characterName: characterData.name,
                    characterPersona: characterData.description
                }
            });
            if (!imageResult.success) {
                console.error('❌ Img2img generation failed:', imageResult.error);
                return {
                    success: false,
                    error: imageResult.error || 'Failed to generate consistent character image'
                };
            }
            console.log('✅ Img2img generation successful, proceeding to Bunny CDN upload...');
            // Convert base64 to buffer for Bunny CDN upload
            const base64Image = imageResult.imageUrl?.replace('data:image/png;base64,', '') || '';
            const imageBuffer = Buffer.from(base64Image, 'base64');
            // Upload to Bunny CDN
            const uploadResult = await this.uploadToBunny(imageBuffer, username, `${characterData.name}_variation`);
            if (!uploadResult.success) {
                console.error('❌ Bunny CDN upload failed:', uploadResult.error);
                return {
                    success: false,
                    error: uploadResult.error || 'Failed to upload consistent image'
                };
            }
            console.log('✅ Character consistent image generation and upload successful!');
            return {
                success: true,
                imageUrl: uploadResult.imageUrl,
                generationData: {
                    originalImageUrl: baseImageUrl,
                    newPrompt,
                    denoisingStrength,
                    artStyle,
                    bunnyPublicId: uploadResult.publicId,
                    generationTime: new Date(),
                    method: 'img2img_consistency'
                }
            };
        }
        catch (error) {
            console.error('❌ Character consistent image generation error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during consistent image generation'
            };
        }
    }
    /**
     * Build negative prompt for character generation
     */
    static buildNegativePrompt(artStyle) {
        const baseNegative = [
            '(worst quality, low quality, normal quality)',
            'lowres',
            'bad anatomy',
            'bad hands',
            'signature',
            'watermarks',
            'ugly',
            'imperfect eyes',
            'unnatural face',
            'unnatural body',
            'error',
            'extra limb',
            'missing limbs'
        ];
        // Add style-specific negative prompts
        switch (artStyle.toLowerCase()) {
            case 'realistic':
                baseNegative.push('cartoon', 'anime', 'toon');
                break;
            case 'anime':
            case 'cartoon':
            case 'fantasy':
                baseNegative.push('photorealistic', '3d render', 'photograph');
                break;
        }
        return baseNegative.join(', ');
    }
}
