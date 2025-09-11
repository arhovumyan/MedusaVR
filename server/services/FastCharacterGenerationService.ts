import 'dotenv/config';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { BunnyFolderService } from './BunnyFolderService.js';
import { CharacterEmbeddingService } from './CharacterEmbeddingService.js';
import fetch from 'node-fetch';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface FastGenerationOptions {
  characterName: string;
  description: string;
  positivePrompt?: string;
  negativePrompt?: string;
  personalityTraits: {
    mainTrait: string;
    subTraits: string[];
  };
  artStyle: {
    primaryStyle: string;
  };
  selectedTags: {
    [key: string]: string[];
  };
  userId: string;
  username: string;
  isNsfw?: boolean;
  positivePromptFile?: string;
  negativePromptFile?: string;
  model?: string;
  steps?: number;
  cfg?: number;
  width?: number;
  height?: number;
}

export interface FastGenerationResult {
  success: boolean;
  character?: any;
  imageUrl?: string;
  characterSeed?: number;
  generationTime?: number;
  error?: string;
}

export class FastCharacterGenerationService {
  private cacheFile: string = '.last_image_number';

  constructor() {
    // Art style routing is now handled by getWebUIUrlForStyle method
  }

  /**
   * Get the appropriate WebUI URL based on art style
   * anime/cartoon/fantasy → 7861, realistic → 7860
   */
  private getWebUIUrlForStyle(style?: string): string {
    console.log(`🔍 Getting WebUI URL for style: "${style}"`);
    console.log(`🔧 Environment variables:`, {
      RUNPOD_ANIME_CARTOON_FANTASY_URL: process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL || 'NOT SET',
      RUNPOD_REALISTIC_URL: process.env.RUNPOD_REALISTIC_URL || 'NOT SET',
      RUNPOD_WEBUI_URL: process.env.RUNPOD_WEBUI_URL || 'NOT SET'
    });

    // If no style provided, use fallback URL
    if (!style) {
      const fallbackUrl = process.env.RUNPOD_WEBUI_URL || process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL || 'https://4mm1jblh0l3mv2-7861.proxy.runpod.net';
      console.log(`⚠️ No style provided, using fallback URL: ${fallbackUrl}`);
      return fallbackUrl;
    }

    // Map art styles to URLs (corrected mapping)
    switch (style.toLowerCase()) {
      case 'realistic':
        const realisticUrl = process.env.RUNPOD_REALISTIC_URL || process.env.RUNPOD_WEBUI_URL || process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL || 'https://vkfydhwbdpn6pq-7860.proxy.runpod.net';
        console.log(`🎨 Using realistic checkpoint: ${realisticUrl}`);
        return realisticUrl;
      
      case 'anime':
      case 'cartoon':
      case 'fantasy':
      default:
        const animeUrl = process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL || process.env.RUNPOD_WEBUI_URL || 'https://4mm1jblh0l3mv2-7861.proxy.runpod.net';
        console.log(`🎨 Using anime/cartoon/fantasy checkpoint: ${animeUrl}`);
        return animeUrl;
    }
  }

  /**
   * Get the appropriate model checkpoint based on art style
   */
  private getModelForArtStyle(style: string): string {
    switch (style.toLowerCase()) {
      case 'realistic':
        return 'cyberrealistic.safetensors';
      case 'anime':
      case 'cartoon':
      case 'fantasy':
      default:
        return 'diving.safetensors';
    }
  }

  /**
   * Load prompts from files (similar to simplified_tester.sh)
   */
  private async loadPrompts(positiveFile?: string, negativeFile?: string) {
    try {
      const positivePromptPath = positiveFile || path.join(process.cwd(), 'root/positive_prompt.txt');
      const negativePromptPath = negativeFile || path.join(process.cwd(), 'root/negative_prompt.txt');
      
      let positivePrompt = '';
      let negativePrompt = '';
      
      if (fs.existsSync(positivePromptPath)) {
        positivePrompt = fs.readFileSync(positivePromptPath, 'utf-8').trim();
      }
      
      if (fs.existsSync(negativePromptPath)) {
        negativePrompt = fs.readFileSync(negativePromptPath, 'utf-8').trim();
      }
      
      return { positivePrompt, negativePrompt };
    } catch (error) {
      console.error('Error loading prompt files:', error);
      return { 
        positivePrompt: 'masterpiece, best quality, amazing quality, very aesthetic, 4k, detailed', 
        negativePrompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry'
      };
    }
  }

  /**
   * Get last known image number from cache
   */
  private async getLastImageNumber(): Promise<number> {
    try {
      const cacheFilePath = path.join(process.cwd(), 'root', this.cacheFile);
      if (fs.existsSync(cacheFilePath)) {
        const lastKnown = parseInt(fs.readFileSync(cacheFilePath, 'utf-8').trim());
        console.log(`📁 Last known image number from cache: ${lastKnown}`);
        return lastKnown;
      }
    } catch (error) {
      console.error('Error reading cache file:', error);
    }
    
    console.log(`📁 No cache found, starting from 0`);
    return 0;
  }

  /**
   * Update last known image number in cache
   */
  private async updateLastImageNumber(imageNumber: number): Promise<void> {
    try {
      const rootDir = path.join(process.cwd(), 'root');
      const cacheFilePath = path.join(rootDir, this.cacheFile);
      
      // Create root directory if it doesn't exist
      if (!fs.existsSync(rootDir)) {
        fs.mkdirSync(rootDir, { recursive: true });
      }
      
      fs.writeFileSync(cacheFilePath, imageNumber.toString());
      console.log(`📁 Updated cache with image number: ${imageNumber}`);
    } catch (error) {
      console.error('Error updating cache file:', error);
    }
  }

  /**
   * Generate character seed for consistency
   */
  private generateCharacterSeed(name: string, description: string): number {
    const combined = `${name.toLowerCase()}_${description.toLowerCase()}`;
    const hash = crypto.createHash('md5').update(combined).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  /**
   * Build enhanced prompt with character data
   */
  private buildPrompt(options: FastGenerationOptions, basePrompt: string): string {
    const promptParts: string[] = [];

    // Start with user's positive prompt if provided, otherwise use description
    if (options.positivePrompt && options.positivePrompt.trim()) {
      promptParts.push(options.positivePrompt.trim());
    } else if (options.description) {
      promptParts.push(options.description);
    }

    // Add art style
    switch (options.artStyle.primaryStyle.toLowerCase()) {
      case 'anime':
        promptParts.push('anime style');
        break;
      case 'realistic':
        promptParts.push('photorealistic, realistic');
        break;
      case 'fantasy':
        promptParts.push('fantasy art style');
        break;
      case 'cartoon':
        promptParts.push('cartoon style');
        break;
      default:
        promptParts.push('anime style');
    }

    // Add personality traits
    if (options.personalityTraits.mainTrait) {
      promptParts.push(options.personalityTraits.mainTrait);
    }
    
    if (options.personalityTraits.subTraits.length > 0) {
      promptParts.push(...options.personalityTraits.subTraits);
    }

    // Add all selected tags
    Object.entries(options.selectedTags).forEach(([category, tags]) => {
      if (Array.isArray(tags) && tags.length > 0) {
        // Skip content-rating as it's not visual
        if (category !== 'content-rating') {
          promptParts.push(...tags);
        }
      }
    });

    // Only add base prompt if user hasn't provided their own specific prompt
    if (basePrompt && !options.positivePrompt && !promptParts.includes(basePrompt)) {
      promptParts.push(basePrompt);
    }

    return promptParts.join(', ');
  }

  /**
   * Build enhanced negative prompt with user input
   */
  private buildNegativePrompt(options: FastGenerationOptions, baseNegativePrompt: string): string {
    const negParts: string[] = [];

    // Start with user's negative prompt if provided
    if (options.negativePrompt && options.negativePrompt.trim()) {
      negParts.push(options.negativePrompt.trim());
    }

    // Add base negative prompt
    if (baseNegativePrompt && baseNegativePrompt.trim()) {
      negParts.push(baseNegativePrompt.trim());
    }

    // Add standard negative prompts if not already included
    const standardNegatives = [
      'lowres', 'bad anatomy', 'bad hands', 'text', 'error', 
      'missing fingers', 'extra digit', 'fewer digits', 'cropped', 
      'worst quality', 'low quality', 'normal quality', 'jpeg artifacts',
      'signature', 'watermark', 'username', 'blurry', 'ugly'
    ];

    const currentNegText = negParts.join(', ').toLowerCase();
    standardNegatives.forEach(neg => {
      if (!currentNegText.includes(neg.toLowerCase())) {
        negParts.push(neg);
      }
    });

    // Add NSFW filtering if not NSFW content
    if (!options.isNsfw && !currentNegText.includes('nsfw')) {
      negParts.push('nsfw', 'nude', 'naked', 'explicit');
    }

    return negParts.join(', ');
  }

  /**
   * Create workflow JSON (similar to simplified_tester.sh)
   */
  private createWorkflow(
    prompt: string, 
    negativePrompt: string, 
    seed: number,
    options: FastGenerationOptions
  ): any {
    return {
      prompt: {
        "0": {
          "class_type": "CheckpointLoaderSimple",
          "inputs": { 
            "ckpt_name": options.model || "diving.safetensors" 
          }
        },
        "1": {
          "class_type": "CLIPTextEncode",
          "inputs": {
            "clip": ["0", 1],
            "text": prompt
          }
        },
        "2": {
          "class_type": "CLIPTextEncode",
          "inputs": {
            "clip": ["0", 1],
            "text": negativePrompt
          }
        },
        "3": {
          "class_type": "EmptyLatentImage",
          "inputs": { 
            "width": options.width || 1024, 
            "height": options.height || 1024, 
            "batch_size": 1 
          }
        },
        "4": {
          "class_type": "KSampler",
          "inputs": {
            "model": ["0", 0],
            "positive": ["1", 0],
            "negative": ["2", 0],
            "latent_image": ["3", 0],
            "steps": options.steps || 25,
            "cfg": options.cfg || 6,
            "sampler_name": "dpmpp_2m",
            "scheduler": "karras",
            "denoise": 1.0,
            "seed": seed
          }
        },
        "5": {
          "class_type": "VAEDecode",
          "inputs": { "samples": ["4", 0], "vae": ["0", 2] }
        },
        "6": {
          "class_type": "SaveImage",
          "inputs": {
            "images": ["5", 0],
            "filename_prefix": "output1",
            "increment_index": false
          }
        }
      }
    };
  }

  /**
   * Generate character using RunPod similar to simplified_tester.sh
   */
  async generateCharacterFast(options: FastGenerationOptions): Promise<FastGenerationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Fast generating character: ${options.characterName}`);
      console.log(`🎨 Art Style: ${options.artStyle.primaryStyle}`);

      // Get the correct RunPod URL for the art style
      const runpodUrl = this.getWebUIUrlForStyle(options.artStyle.primaryStyle);
      console.log(`🔗 Using RunPod URL: ${runpodUrl}`);

      // Get the correct model for the art style
      const model = this.getModelForArtStyle(options.artStyle.primaryStyle);
      console.log(`🔧 Using model: ${model}`);

      // 1. Load prompts from files
      const { positivePrompt, negativePrompt } = await this.loadPrompts(
        options.positivePromptFile, 
        options.negativePromptFile
      );

      // 2. Generate character seed for consistency
      const characterSeed = this.generateCharacterSeed(options.characterName, options.description);
      console.log(`🌱 Using character seed: ${characterSeed}`);

      // 3. Build enhanced prompt
      const enhancedPrompt = this.buildPrompt(options, positivePrompt);
      console.log(`📝 Enhanced prompt: ${enhancedPrompt}`);

      // 4. Build negative prompt with user input
      const enhancedNegativePrompt = this.buildNegativePrompt(options, negativePrompt);
      console.log(`📝 Enhanced negative prompt: ${enhancedNegativePrompt}`);

      // 5. Create character-specific filename for image tracking
      const sanitizedCharacterName = options.characterName.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20); // Limit length for filename safety
      const characterImageFilename = `${options.characterName}_avatar`;
      
      console.log(`📁 Using character-specific filename: ${characterImageFilename}`);

      // 5. Use ComfyUI-compatible workflow with character-specific naming and art style-based model
      const workflow = {
        client_id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
        prompt: {
          "0": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": { "ckpt_name": model }
          },
          "1": {
            "class_type": "CLIPTextEncode",
            "inputs": {
              "clip": ["0", 1],
              "text": enhancedPrompt
            }
          },
          "2": {
            "class_type": "CLIPTextEncode",
            "inputs": {
              "clip": ["0", 1],
              "text": enhancedNegativePrompt
            }
          },
          "3": {
            "class_type": "EmptyLatentImage",
            "inputs": { 
              "width": 1024, 
              "height": 1024, 
              "batch_size": 1 
            }
          },
          "4": {
            "class_type": "KSampler",
            "inputs": {
              "model": ["0", 0],
              "positive": ["1", 0],
              "negative": ["2", 0],
              "latent_image": ["3", 0],
              "steps": 25,
              "cfg": 6,
              "sampler_name": "dpmpp_2m",
              "scheduler": "karras",
              "denoise": 1.0,
              "seed": characterSeed,
              "force_full_denoise": "enable"
            }
          },
          "5": {
            "class_type": "VAEDecode",
            "inputs": { "samples": ["4", 0], "vae": ["0", 2] }
          },
          "6": {
            "class_type": "SaveImage",
            "inputs": {
              "images": ["5", 0],
              "filename_prefix": characterImageFilename,
              "increment_index": false
            }
          }
        }
      };

      // 6. Submit workflow to RunPod
      console.log(`🚀 Sending workflow to RunPod...`);
      console.log(`🎯 Prompt preview: ${enhancedPrompt.substring(0, 100)}...`);
      console.log(`🌱 Seed: ${characterSeed}`);
      
      // Normalize URL to avoid double slashes
      const normalizedUrl = runpodUrl.endsWith('/') ? runpodUrl.slice(0, -1) : runpodUrl;
      const promptUrl = `${normalizedUrl}/prompt`;
      
      const response = await fetch(promptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow)
      });

      if (!response.ok) {
        throw new Error(`RunPod request failed: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json() as any;
      console.log(`📤 RunPod response:`, responseData);

      if (!responseData.prompt_id) {
        throw new Error('No prompt_id received from RunPod');
      }

      const promptId = responseData.prompt_id;
      console.log(`✅ Workflow submitted successfully. Prompt ID: ${promptId}`);

      // 7. Poll ComfyUI queue to wait for completion (like EmbeddingBasedImageGenerationService)
      console.log(`⏳ Polling ComfyUI queue for prompt ${promptId}...`);
      
      let queueComplete = false;
      let pollAttempts = 0;
      const maxPollAttempts = 60; // 60 attempts * 3 seconds = 3 minutes max wait
      
      while (!queueComplete && pollAttempts < maxPollAttempts) {
        try {
          const queueResponse = await fetch(`${normalizedUrl}/queue`);
          if (queueResponse.ok) {
            const queueData = await queueResponse.json() as any;
            
            // Check if our prompt is still in the queue
            const isInQueue = queueData.queue_pending?.some((item: any) => item[1] === promptId) ||
                             queueData.queue_running?.some((item: any) => item[1] === promptId);
            
            if (!isInQueue) {
              // Prompt is no longer in queue, it should be complete
              queueComplete = true;
              console.log(`✅ ComfyUI queue completed for prompt ${promptId} after ${pollAttempts + 1} polls`);
            } else {
              console.log(`⏳ Prompt ${promptId} still in queue, waiting... (attempt ${pollAttempts + 1}/${maxPollAttempts})`);
            }
          } else {
            console.log(`⚠️ Could not poll queue status: ${queueResponse.status}`);
          }
        } catch (error) {
          console.log(`⚠️ Queue polling error: ${error}`);
        }
        
        if (!queueComplete) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between polls
          pollAttempts++;
        }
      }
      
      if (!queueComplete) {
        console.log(`⚠️ Queue polling timeout after ${maxPollAttempts} attempts, proceeding with file search anyway...`);
      }

      // Brief wait for file system sync
      console.log(`⏳ Brief wait for file system sync...`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 8. Download generated image using character-specific filename
      const expectedImageFilename = `${characterImageFilename}_00001_.png`;
      console.log(`🎯 Expected character image: ${expectedImageFilename}`);

      const imageUrl = `${normalizedUrl}/view?filename=${expectedImageFilename}`;
      console.log(`⬇️ Downloading from: ${imageUrl}`);

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      
      // Validate image
      if (imageBuffer.length === 0) {
        throw new Error('Downloaded image is empty');
      }

      console.log(`✅ Image downloaded successfully. Size: ${(imageBuffer.length / 1024).toFixed(1)}KB`);

      // 9. Create character folders in Bunny CDN
      await BunnyFolderService.createCharacterFolders(options.username, options.characterName);

      // 10. Upload to Bunny CDN with proper filename format
      const avatarFileName = `${options.characterName}_avatar.png`;
      const uploadResult = await BunnyFolderService.uploadToCharacterFolder(
        options.username,
        options.characterName,
        imageBuffer,
        avatarFileName,
        'avatar'
      );

      if (!uploadResult.success) {
        throw new Error(`Bunny CDN upload failed: ${uploadResult.error}`);
      }

      console.log(`✅ Uploaded to Bunny CDN: ${uploadResult.url}`);

      // 11. Generate unique character ID
      let characterId: number;
      let exists = true;
      
      while (exists) {
        characterId = Math.floor(Math.random() * 1000000) + 100000;
        const existingChar = await CharacterModel.findOne({ id: characterId });
        exists = !!existingChar;
      }

      console.log(`🆔 Generated character ID: ${characterId!}`);

      // 12. Create character embeddings
      const embeddingText = [
        options.characterName,
        options.description,
        options.personalityTraits.mainTrait,
        ...options.personalityTraits.subTraits,
        ...Object.values(options.selectedTags).flat()
      ].join(' ');

      const hash = crypto.createHash('sha256').update(embeddingText).digest('hex');
      const embedding = Array.from({ length: 384 }, (_, i) => 
        parseInt(hash.slice(i % hash.length, (i % hash.length) + 2), 16) / 255
      );

      const embeddings = {
        text: embeddingText,
        vector: embedding,
        dimension: 384,
        model: 'hash-based-v1',
        characterSeed: characterSeed
      };

      // Upload embeddings to Bunny CDN
      const embeddingsResult = await BunnyFolderService.uploadToCharacterFolder(
        options.username,
        options.characterName,
        Buffer.from(JSON.stringify(embeddings, null, 2), 'utf-8'),
        `embeddings-${Date.now()}.json`,
        'embeddings'
      );

      // 13. Save character to database
      const characterDocumentData = {
        id: characterId!,
        avatar: uploadResult.url!,
        name: options.characterName,
        description: options.description,
        age: 25, // Set default age to 25 (adult) for all characters
        quickSuggestion: `Chat with ${options.characterName}, ${options.personalityTraits.mainTrait} character`,
        rating: options.isNsfw ? 'R' : 'PG',
        nsfw: options.isNsfw || false,
        isNsfw: options.isNsfw || false,  // Also set isNsfw field
        chatCount: 0,
        likes: 0,
        commentsCount: 0,
        creatorId: options.userId,
        creatorName: options.username,  // Set creator name from options
        
        // Enhanced character creation fields
        personalityTraits: options.personalityTraits,
        artStyle: options.artStyle,
        selectedTags: options.selectedTags,
        
        // Image generation data
        imageGeneration: {
          prompt: enhancedPrompt,
          negativePrompt: negativePrompt,
          seed: characterSeed,
          characterSeed: characterSeed,
          steps: options.steps || 25,
          cfgScale: options.cfg || 6,
          width: options.width || 1024,
          height: options.height || 1024,
          model: options.model || 'diving.safetensors',
          generationTime: new Date()
        },
        
        // Image metadata
        imageMetadata: {
          bunnyPublicId: uploadResult.publicId,
          uploadedAt: new Date(),
          originalFilename: expectedImageFilename,
          generationType: 'generated',
          originalImageUrl: imageUrl,
          thumbnailUrl: uploadResult.url,
          altVersions: []
        },
        
        // Creation metadata
        creationProcess: {
          stepCompleted: 5,
          totalSteps: 5,
          isDraft: false,
          lastSavedAt: new Date(),
          timeSpent: Math.round((Date.now() - startTime) / 1000)
        },

        // Embeddings metadata
        embeddings: {
          url: embeddingsResult.success ? embeddingsResult.url : null,
          dimension: 384,
          model: 'hash-based-v1',
          createdAt: new Date(),
          imageEmbeddings: {
            status: 'generating',
            generationStartedAt: new Date(),
            totalImages: 0,
            bunnyUrls: [],
            version: '1.0'
          }
        }
      };

      console.log(`💾 Saving character to database...`);
      const newCharacter = await CharacterModel.create(characterDocumentData);
      console.log(`✅ Character saved with database ID: ${newCharacter._id}`);

      const generationTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`🎉 Fast character generation completed in ${generationTime} seconds!`);

      // Start background embedding generation (non-blocking)
      // Note: Only start background generation if username is not "BatchCreator" 
      // to avoid database connection issues during batch operations
      if (options.username !== "BatchCreator") {
        console.log(`🔄 Starting background embedding generation for ${options.characterName}...`);
        const embeddingService = new CharacterEmbeddingService();
        
        embeddingService.generateEmbeddingImagesBackground({
          characterId: newCharacter.id.toString(),
          characterName: options.characterName,
          description: options.description,
          personalityTraits: options.personalityTraits,
          artStyle: options.artStyle,
          selectedTags: options.selectedTags,
          userId: options.userId,
          username: options.username,
          characterSeed: characterSeed,
          basePrompt: enhancedPrompt,
          baseNegativePrompt: negativePrompt
        });

        console.log(`🚀 Background embedding generation initiated for ${options.characterName}`);
      } else {
        console.log(`⏭️ Skipping background embedding generation for ${options.characterName} (batch mode)`);
      }

      return {
        success: true,
        character: {
          id: newCharacter.id,
          _id: newCharacter._id,
          name: newCharacter.name,
          avatar: newCharacter.avatar,
          description: newCharacter.description,
          characterSeed: characterSeed,
          embeddingsUrl: embeddingsResult.success ? embeddingsResult.url : null,
          bunnyFolders: BunnyFolderService.getCharacterFolderPaths(options.username, options.characterName),
          embeddingGenerationStarted: true
        },
        imageUrl: uploadResult.url!,
        characterSeed: characterSeed,
        generationTime: generationTime
      };

    } catch (error) {
      console.error(`❌ Fast character generation failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate multiple characters rapidly
   */
  async generateBatchCharactersFast(
    characterTemplates: FastGenerationOptions[],
    batchSize: number = 3,
    delayBetween: number = 2000
  ): Promise<FastGenerationResult[]> {
    const results: FastGenerationResult[] = [];
    
    console.log(`🚀 Starting fast batch generation of ${characterTemplates.length} characters...`);
    console.log(`📦 Batch size: ${batchSize}, Delay between: ${delayBetween}ms`);

    for (let i = 0; i < characterTemplates.length; i += batchSize) {
      const batch = characterTemplates.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(characterTemplates.length / batchSize)}`);

      // Process batch in parallel for speed
      const batchPromises = batch.map(async (template, index) => {
        console.log(`🎭 Generating ${i + index + 1}/${characterTemplates.length}: ${template.characterName}`);
        return await this.generateCharacterFast(template);
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Log batch results
      batchResults.forEach((result, index) => {
        if (result.success) {
          console.log(`✅ ${i + index + 1}. ${result.character?.name} - Generated in ${result.generationTime}s`);
        } else {
          console.log(`❌ ${i + index + 1}. ${batch[index].characterName} - Error: ${result.error}`);
        }
      });

      // Add delay between batches to avoid overwhelming RunPod
      if (i + batchSize < characterTemplates.length) {
        console.log(`⏳ Waiting ${delayBetween / 1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetween));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n📊 Fast batch generation summary:`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success rate: ${(successful / results.length * 100).toFixed(1)}%`);

    return results;
  }
}
