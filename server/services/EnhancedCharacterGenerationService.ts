import { v2 as cloudinary } from 'cloudinary';
import ComfyUIService from './ComfyUIService.js';
import crypto from 'crypto';
import fetch from 'node-fetch';

export interface EnhancedCharacterRequest {
  name: string;
  description: string;
  positivePrompt?: string;
  negativePrompt?: string;
  personalityTraits?: {
    mainTrait?: string;
    subTraits?: string[];
  };
  artStyle?: {
    primaryStyle?: string;
  };
  selectedTags?: {
    [key: string]: string[];
  };
  username: string;
  userId: string;
  generateEmbeddings?: boolean;
  embeddingImageCount?: number;
}

export interface EnhancedCharacterResult {
  success: boolean;
  character?: {
    id: number;
    name: string;
    avatar: string;
    folderPath: string;
    imageGeneration: {
      characterSeed: number;
      prompt: string;
      negativePrompt: string;
      steps: number;
      cfg: number;
      width: number;
      height: number;
      generationTime: Date;
      comfyUIWorkflow: any;
    };
    embeddings?: {
      images: string[];
      seeds: number[];
      embeddingData: any;
    };
    cloudinaryUrls: {
      avatar: string;
      folder: string;
      embeddingImages?: string[];
    };
  };
  error?: string;
}

class EnhancedCharacterGenerationService {
  private comfyUI: ComfyUIService;

  constructor() {
    this.comfyUI = new ComfyUIService();
  }

  /**
   * Generate a unique character ID
   */
  private generateCharacterId(): number {
    return Math.floor(Math.random() * 1000000) + Date.now();
  }

  /**
   * Generate character seed based on name and description for consistency
   */
  private generateCharacterSeed(name: string, description: string): number {
    const combined = `${name.toLowerCase()}_${description.toLowerCase()}`;
    const hash = crypto.createHash('md5').update(combined).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  /**
   * Build a comprehensive prompt from character data
   */
  private buildCharacterPrompt(request: EnhancedCharacterRequest): string {
    const parts: string[] = [];

    // Start with user's positive prompt if provided, otherwise use description
    if (request.positivePrompt && request.positivePrompt.trim()) {
      parts.push(request.positivePrompt.trim());
    } else if (request.description && request.description.trim()) {
      parts.push(request.description.trim());
    }

    // Add art style
    const artStyle = request.artStyle?.primaryStyle || 'anime';
    switch (artStyle.toLowerCase()) {
      case 'anime':
        parts.push('anime style');
        break;
      case 'realistic':
        parts.push('photorealistic, realistic');
        break;
      case 'fantasy':
        parts.push('fantasy art style');
        break;
      case 'cartoon':
        parts.push('cartoon style');
        break;
      default:
        parts.push('anime style');
    }

    // Add personality traits
    if (request.personalityTraits?.mainTrait) {
      parts.push(request.personalityTraits.mainTrait);
    }
    if (request.personalityTraits?.subTraits?.length) {
      parts.push(...request.personalityTraits.subTraits);
    }

    // Add all selected tags (character type, appearance, etc.)
    if (request.selectedTags) {
      Object.entries(request.selectedTags).forEach(([category, tags]) => {
        if (Array.isArray(tags) && tags.length > 0) {
          // Skip content-rating as it's not visual
          if (category !== 'content-rating') {
            parts.push(...tags);
          }
        }
      });
    }

    // Add quality enhancers
    parts.push('masterpiece, best quality, highly detailed, sharp focus');

    return parts.join(', ');
  }

  /**
   * Build negative prompt to avoid unwanted elements
   */
  private buildNegativePrompt(request: EnhancedCharacterRequest): string {
    const negParts: string[] = [];

    // Start with user's negative prompt if provided
    if (request.negativePrompt && request.negativePrompt.trim()) {
      negParts.push(request.negativePrompt.trim());
    }

    // Add standard negative prompts
    const standardNegatives = [
      'lowres', 'bad anatomy', 'bad hands', 'text', 'error', 
      'missing fingers', 'extra digit', 'fewer digits', 'cropped', 
      'worst quality', 'low quality', 'normal quality', 'jpeg artifacts',
      'signature', 'watermark', 'username', 'blurry', 'ugly',
      'duplicate', 'morbid', 'mutilated', 'extra fingers', 'mutated hands',
      'poorly drawn hands', 'poorly drawn face', 'mutation', 'deformed'
    ];
    negParts.push(...standardNegatives);

    // Add NSFW filtering if not NSFW content
    const isNsfw = request.selectedTags?.['content-rating']?.includes('nsfw') || false;
    if (!isNsfw) {
      negParts.push('nsfw', 'nude', 'naked', 'explicit');
    }

    return negParts.join(', ');
  }

  /**
   * Create Cloudinary folder structure for character
   */
  private async createCharacterFolders(characterName: string, username: string): Promise<{
    success: boolean;
    folderPath?: string;
    error?: string;
  }> {
    try {
      const safeName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const baseFolderPath = `${username}/characters/${safeName}`;
      
      console.log(`📁 Creating Cloudinary folder structure: ${baseFolderPath}`);

      // Create placeholder to establish folder structure
      const placeholder = Buffer.from('MedusaVR Character Folder');
      
      const subfolders = [
        'avatar',
        'images', 
        'variations',
        'embeddings',
        'generations'
      ];

      for (const subfolder of subfolders) {
        const folderPath = `${baseFolderPath}/${subfolder}`;
        await cloudinary.uploader.upload(
          `data:text/plain;base64,${placeholder.toString('base64')}`,
          {
            folder: folderPath,
            public_id: '.folder_created',
            resource_type: 'raw',
            overwrite: true,
          }
        );
        console.log(`✅ Created folder: ${folderPath}`);
      }

      return {
        success: true,
        folderPath: baseFolderPath
      };
    } catch (error) {
      console.error('❌ Failed to create character folders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload image URL to Cloudinary
   */
  private async uploadImageToCloudinary(
    imageUrl: string, 
    folderPath: string, 
    fileName: string
  ): Promise<{ success: boolean; cloudinaryUrl?: string; error?: string }> {
    try {
      console.log(`⬆️ Uploading image to Cloudinary: ${fileName}`);
      
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: folderPath,
        public_id: fileName,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      console.log(`✅ Image uploaded to Cloudinary: ${result.secure_url}`);
      return {
        success: true,
        cloudinaryUrl: result.secure_url
      };
    } catch (error) {
      console.error(`❌ Failed to upload image to Cloudinary:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create character embeddings from multiple images
   */
  private async createCharacterEmbeddings(
    images: string[], 
    seeds: number[], 
    characterData: EnhancedCharacterRequest
  ): Promise<any> {
    try {
      console.log('🧠 Creating character embeddings from generated images');
      
      // Create a comprehensive text representation
      const embeddingText = [
        characterData.name,
        characterData.description,
        characterData.personalityTraits?.mainTrait || '',
        ...(characterData.personalityTraits?.subTraits || []),
        ...Object.values(characterData.selectedTags || {}).flat()
      ].filter(Boolean).join(' ');

      // Create hash-based embedding (in production, use actual ML embeddings)
      const hash = crypto.createHash('sha256').update(embeddingText).digest('hex');
      const embedding = Array.from({ length: 512 }, (_, i) => 
        parseInt(hash.slice(i % hash.length, (i % hash.length) + 2), 16) / 255
      );

      return {
        text: embeddingText,
        vector: embedding,
        dimension: 512,
        images: images,
        seeds: seeds,
        generatedAt: new Date(),
        characterName: characterData.name,
        version: '1.0'
      };
    } catch (error) {
      console.error('❌ Failed to create character embeddings:', error);
      return null;
    }
  }

  /**
   * Upload embeddings to Cloudinary
   */
  private async uploadEmbeddings(
    embeddings: any, 
    folderPath: string, 
    characterName: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const embeddingsJson = JSON.stringify(embeddings, null, 2);
      const safeName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      const result = await cloudinary.uploader.upload(
        `data:application/json;base64,${Buffer.from(embeddingsJson).toString('base64')}`,
        {
          folder: `${folderPath}/embeddings`,
          public_id: `${safeName}_embeddings`,
          resource_type: 'raw',
          overwrite: true,
        }
      );

      console.log(`✅ Embeddings uploaded: ${result.secure_url}`);
      return {
        success: true,
        url: result.secure_url
      };
    } catch (error) {
      console.error('❌ Failed to upload embeddings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate a complete character with avatar and embeddings
   */
  async generateCompleteCharacter(request: EnhancedCharacterRequest): Promise<EnhancedCharacterResult> {
    const startTime = Date.now();
    console.log('🎭 Starting complete character generation for:', request.name);

    try {
      // 1. Test ComfyUI connection
      console.log('🔍 Testing ComfyUI connection...');
      const isConnected = await this.comfyUI.testConnection();
      if (!isConnected) {
        throw new Error('ComfyUI is not accessible');
      }

      // 2. Generate character ID and seed
      const characterId = this.generateCharacterId();
      const characterSeed = this.generateCharacterSeed(request.name, request.description);
      
      console.log(`🆔 Character ID: ${characterId}`);
      console.log(`🌱 Character seed: ${characterSeed}`);

      // 3. Create folder structure
      console.log('📁 Creating character folders...');
      const folderResult = await this.createCharacterFolders(request.name, request.username);
      if (!folderResult.success) {
        throw new Error(`Failed to create folders: ${folderResult.error}`);
      }

      // 4. Build prompts
      const prompt = this.buildCharacterPrompt(request);
      const negativePrompt = this.buildNegativePrompt(request);
      
      console.log('📝 Generated prompt:', prompt.substring(0, 150) + '...');

      // 5. Generate main avatar
      console.log('🎨 Generating main character avatar...');
      const avatarResult = await this.comfyUI.generateCharacterImage({
        prompt: prompt,
        negativePrompt: negativePrompt,
        width: 1024,
        height: 1024,
        steps: 25,
        cfg: 6,
        seed: characterSeed,
        characterName: request.name,
        sampler: 'dpmpp_2m',
        scheduler: 'karras'
      });

      if (!avatarResult.success || !avatarResult.imageUrl) {
        throw new Error(`Avatar generation failed: ${avatarResult.error}`);
      }

      console.log('✅ Avatar generated successfully!');

      // 6. Upload avatar to Cloudinary
      console.log('⬆️ Uploading avatar to Cloudinary...');
      const safeName = request.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const avatarUpload = await this.uploadImageToCloudinary(
        avatarResult.imageUrl,
        `${folderResult.folderPath}/avatar`,
        `${safeName}_avatar`
      );

      if (!avatarUpload.success) {
        throw new Error(`Avatar upload failed: ${avatarUpload.error}`);
      }

      // 7. Generate embedding images if requested
      let embeddingData: any = null;
      let embeddingImageUrls: string[] = [];
      
      if (request.generateEmbeddings !== false) {
        const embeddingCount = request.embeddingImageCount || 5;
        console.log(`🧠 Generating ${embeddingCount} images for embeddings...`);
        
        const embeddingResult = await this.comfyUI.generateEmbeddingImages({
          prompt: prompt,
          negativePrompt: negativePrompt,
          width: 1024,
          height: 1024,
          steps: 20, // Slightly faster for embeddings
          cfg: 6,
          characterName: request.name,
          sampler: 'dpmpp_2m',
          scheduler: 'karras'
        }, embeddingCount);

        if (embeddingResult.success && embeddingResult.images.length > 0) {
          console.log(`✅ Generated ${embeddingResult.images.length} embedding images`);
          
          // Upload embedding images to Cloudinary
          for (let i = 0; i < embeddingResult.images.length; i++) {
            const imageUrl = embeddingResult.images[i];
            const uploadResult = await this.uploadImageToCloudinary(
              imageUrl,
              `${folderResult.folderPath}/embeddings`,
              `${safeName}_embed_${i + 1}`
            );
            
            if (uploadResult.success) {
              embeddingImageUrls.push(uploadResult.cloudinaryUrl!);
            }
          }

          // Create embeddings
          embeddingData = await this.createCharacterEmbeddings(
            embeddingImageUrls,
            embeddingResult.seeds,
            request
          );

          // Upload embeddings data
          if (embeddingData) {
            await this.uploadEmbeddings(embeddingData, folderResult.folderPath!, request.name);
          }
        } else {
          console.warn('⚠️ Embedding image generation failed, continuing without embeddings');
        }
      }

      // 8. Build final result
      const generationTime = Date.now() - startTime;
      console.log(`🎉 Character generation completed in ${generationTime}ms`);

      const result: EnhancedCharacterResult = {
        success: true,
        character: {
          id: characterId,
          name: request.name,
          avatar: avatarUpload.cloudinaryUrl!,
          folderPath: folderResult.folderPath!,
          imageGeneration: {
            characterSeed: characterSeed,
            prompt: prompt,
            negativePrompt: negativePrompt,
            steps: 25,
            cfg: 6,
            width: 1024,
            height: 1024,
            generationTime: new Date(),
            comfyUIWorkflow: avatarResult.workflow
          },
          embeddings: embeddingData ? {
            images: embeddingImageUrls,
            seeds: embeddingData.seeds || [],
            embeddingData: embeddingData
          } : undefined,
          cloudinaryUrls: {
            avatar: avatarUpload.cloudinaryUrl!,
            folder: folderResult.folderPath!,
            embeddingImages: embeddingImageUrls.length > 0 ? embeddingImageUrls : undefined
          }
        }
      };

      return result;

    } catch (error) {
      console.error('❌ Complete character generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default EnhancedCharacterGenerationService;
