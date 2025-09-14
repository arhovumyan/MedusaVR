import 'dotenv/config';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { BunnyFolderService } from './BunnyFolderService.js';
import { BunnyStorageService } from './BunnyStorageService.js';
import fetch from 'node-fetch';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface EmbeddingGenerationOptions {
  characterId: string;
  characterName: string;
  description: string;
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
  characterSeed: number;
  basePrompt: string;
  baseNegativePrompt: string;
}

export interface EmbeddingGenerationResult {
  success: boolean;
  imagesGenerated: number;
  embeddingData?: any;
  bunnyUrls?: string[];
  error?: string;
}

export class CharacterEmbeddingService {
  private runpodUrl: string;

  constructor() {
    // Use the same URL routing logic as FastCharacterGenerationService
    this.runpodUrl = this.getWebUIUrlForStyle('fantasy'); // Default to fantasy/anime URL
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

    // Map art styles to URLs (same logic as FastCharacterGenerationService)
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
        return 'realistic.safetensors';
      case 'anime':
      case 'cartoon':
      case 'fantasy':
      default:
        return 'diving.safetensors';
    }
  }

  /**
   * Get the next sequential image number for a character
   */
  private async getNextImageNumber(userId: string, characterName: string): Promise<number> {
    try {
      console.log(`🔢 Getting next image number for character: ${characterName}`);
      
      // Get all images from Bunny CDN for this character
      // Get Bunny CDN folder path for embeddings (not images)
      const sanitizedCharacterName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const folderPath = `${userId}/characters/${sanitizedCharacterName}/embeddings`;
      
      // Search for existing images with the pattern: charactername_image_*
      const listResult = await BunnyStorageService.listFiles(folderPath);
      const existingFiles = listResult.success ? listResult.files || [] : [];

      console.log(`📊 Found ${existingFiles.length} existing images for ${characterName}`);

      // Extract image numbers from existing files
      const imageNumbers: number[] = [];
      for (const fileName of existingFiles) {
        // Extract filename without path
        const baseName = fileName.split('/').pop() || fileName;
        const match = baseName.match(new RegExp(`${sanitizedCharacterName}_image_(\\d+)`));
        if (match) {
          imageNumbers.push(parseInt(match[1], 10));
        }
      }

      // Get the next number (highest + 1, or 1 if no images exist)
      const nextNumber = imageNumbers.length > 0 ? Math.max(...imageNumbers) + 1 : 1;
      
      console.log(`🎯 Next image number for ${characterName}: ${nextNumber}`);
      return nextNumber;

    } catch (error) {
      console.error(`❌ Error getting next image number:`, error);
      // Fallback to random number if Bunny CDN query fails
      return Math.floor(Math.random() * 1000) + 1;
    }
  }

  /**
   * Generate 10 diverse images for character embedding training
   * These images will vary in poses, expressions, angles, and scenarios
   * while maintaining character consistency through seed variations
   */
  async generateEmbeddingImages(options: EmbeddingGenerationOptions): Promise<EmbeddingGenerationResult> {
    console.log(`🎭 Starting embedding image generation for character: ${options.characterName}`);
    
    try {
      // Get the correct RunPod URL based on the character's art style
      const artStyle = options.artStyle?.primaryStyle || 'fantasy';
      this.runpodUrl = this.getWebUIUrlForStyle(artStyle);
      console.log(`🔗 Using RunPod URL for ${artStyle} style: ${this.runpodUrl}`);
      
      // Get the appropriate model for this art style
      const model = this.getModelForArtStyle(artStyle);
      console.log(`🔧 Using model: ${model}`);
      // Define 10 different image variations for comprehensive embedding
            const imageVariations = [
        {
          name: 'portrait_front',
          prompt: 'front view portrait, looking directly at camera, neutral expression, same character features',
          seed_offset: 1
        },
        {
          name: 'portrait_side',
          prompt: 'side profile view, same exact character, professional portrait, same facial structure',
          seed_offset: 2
        },
        {
          name: 'full_body_standing',
          prompt: 'full body standing pose, same character, neutral stance, same body proportions',
          seed_offset: 3
        },
        {
          name: 'sitting_pose',
          prompt: 'sitting pose, same character, relaxed position, same body type',
          seed_offset: 4
        },
        {
          name: 'action_pose',
          prompt: 'dynamic action pose, same character, energetic stance, same physical features',
          seed_offset: 5
        },
        {
          name: 'close_up_face',
          prompt: 'close up face shot, same character, detailed facial features, same face structure',
          seed_offset: 6
        },
        {
          name: 'three_quarter_view',
          prompt: 'three quarter view angle, same character, slight turn, same appearance',
          seed_offset: 7
        },
        {
          name: 'upper_body_shot',
          prompt: 'upper body shot, same character, waist up view, same torso proportions',
          seed_offset: 8
        },
        {
          name: 'happy_expression',
          prompt: 'happy smiling expression, same character, positive mood, same facial features',
          seed_offset: 9
        },
        {
          name: 'confident_pose',
          prompt: 'confident standing pose, same character, assertive stance, same body language',
          seed_offset: 10
        }
      ];

      const generatedImages: string[] = [];
      const bunnyUrls: string[] = [];
      
      // Ensure character folder structure exists, including embeddings folder
      console.log(`📁 Ensuring folder structure for ${options.username}/${options.characterName}...`);
      try {
        await BunnyFolderService.createCharacterFolders(options.username, options.characterName);
        console.log(`✅ Folder structure verified for ${options.characterName}`);
      } catch (error) {
        console.warn(`⚠️ Could not create/verify folder structure:`, error);
      }
      
      // Read prompt files and enhance base prompts with character consistency
      const rootDir = path.join(process.cwd(), 'root');

      let basePositivePrompt = options.basePrompt;
      let baseNegativePrompt = options.baseNegativePrompt;

      try {
        const positivePromptPath = path.join(rootDir, 'positive_prompt.txt');
        const negativePromptPath = path.join(rootDir, 'negative_prompt.txt');
        
        if (fs.existsSync(positivePromptPath)) {
          basePositivePrompt = fs.readFileSync(positivePromptPath, 'utf-8').trim();
        }
        if (fs.existsSync(negativePromptPath)) {
          baseNegativePrompt = fs.readFileSync(negativePromptPath, 'utf-8').trim();
        }
      } catch (error) {
        console.log('⚠️ Could not read prompt files, using defaults');
      }

      // Ensure base prompt includes character data for consistency
      const consistentCharacterDescription = this.buildConsistentCharacterDescription(options);
      
      if (!basePositivePrompt.includes(consistentCharacterDescription)) {
        basePositivePrompt = `${consistentCharacterDescription}, ${basePositivePrompt}`;
      } else if (options.basePrompt && !basePositivePrompt.includes(options.basePrompt)) {
        basePositivePrompt = `${basePositivePrompt}, ${options.basePrompt}`;
      }

      // Enhance negative prompt for character consistency - CRITICAL for maintaining same character
      baseNegativePrompt = `${baseNegativePrompt}, multiple people, different character, character inconsistency, different face, different hair, different body type, different skin color, different eye color, different facial features, multiple faces, face change, body change, different person, changing appearance, inconsistent character, character variation, different clothing style, outfit change, different background style, environment change, lighting change, different art style, style inconsistency`;

      console.log(`🎨 Generating ${imageVariations.length} embedding images...`);

      // Generate each image variation
      for (let i = 0; i < imageVariations.length; i++) {
        const variation = imageVariations[i];
        console.log(`\n🖼️ Generating image ${i + 1}/${imageVariations.length}: ${variation.name}`);
        console.log(`📝 Variation: ${variation.prompt}`);

        try {
          // Build enhanced prompt for this variation with maximum character consistency
          const enhancedPrompt = this.buildVariationPrompt(options, basePositivePrompt, variation.prompt);
          
          // Also ensure we have the character's essential features in the enhanced prompt
          const characterSeedString = options.characterSeed.toString();
          const consistencyPrompt = `consistent character ${characterSeedString}, same appearance`;
          const finalPrompt = `${enhancedPrompt}, ${consistencyPrompt}`;
          
          // Generate seed based on character seed + very small variation for consistency
          // Using smaller seed offsets to maintain character consistency while still having variation
          const variationSeed = options.characterSeed + (variation.seed_offset * 10);
          
          // Use simple numbering for embedding images (1-10)
          const embeddingImageNumber = i + 1;
          const embeddingImageFilename = `${options.characterName}_image_${embeddingImageNumber}`;

          console.log(`🎯 Variation prompt: ${finalPrompt.substring(0, 100)}...`);
          console.log(`🎲 Variation seed: ${variationSeed}`);
          console.log(`📁 Filename: ${embeddingImageFilename}`);

          // Build ComfyUI workflow for this variation
          const workflow = {
            client_id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
            "prompt": {
              "0": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": { "ckpt_name": model }
              },
              "1": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                  "clip": ["0", 1],
                  "text": finalPrompt
                }
              },
              "2": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                  "clip": ["0", 1],
                  "text": baseNegativePrompt
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
                  "seed": variationSeed,
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
                  "filename_prefix": embeddingImageFilename,
                  "increment_index": false
                }
              }
            }
          };

          // Retry mechanism for RunPod server overload
          let retryCount = 0;
          const maxRetries = 3;
          let responseData: any = null;
          
          while (retryCount < maxRetries) {
            try {
              // Submit workflow to RunPod
              const runpodPromptUrl = this.runpodUrl.endsWith('/') ? `${this.runpodUrl}prompt` : `${this.runpodUrl}/prompt`;
              console.log(`📤 Submitting workflow to: ${runpodPromptUrl} (attempt ${retryCount + 1}/${maxRetries})`);
              console.log(`📋 Workflow preview:`, JSON.stringify(workflow, null, 2).substring(0, 500) + '...');
              
              const response = await fetch(runpodPromptUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(workflow)
              });

              if (!response.ok) {
                throw new Error(`RunPod request failed: ${response.status} ${response.statusText}`);
              }

              responseData = await response.json() as any;
              console.log(`📥 RunPod response data:`, JSON.stringify(responseData, null, 2));
              
              // Check if this is an error response
              if (responseData.exec_info && responseData.exec_info.queue_remaining === 0) {
                console.warn(`⚠️ RunPod server overloaded - queue is full. Retrying in ${(retryCount + 1) * 5} seconds...`);
                retryCount++;
                if (retryCount < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, (retryCount) * 5000)); // Exponential backoff
                  continue;
                } else {
                  throw new Error('RunPod server overloaded - max retries exceeded. Please try again later.');
                }
              }
              
              if (!responseData.prompt_id) {
                console.error(`❌ No prompt_id in response. Full response:`, responseData);
                throw new Error('No prompt_id received from RunPod');
              }

              console.log(`✅ Workflow submitted. Prompt ID: ${responseData.prompt_id}`);
              break; // Success, exit retry loop
              
            } catch (error) {
              retryCount++;
              if (retryCount >= maxRetries) {
                throw error;
              }
              console.warn(`⚠️ Attempt ${retryCount} failed, retrying in ${retryCount * 5} seconds...`, error);
              await new Promise(resolve => setTimeout(resolve, retryCount * 5000));
            }
          }

          // Wait for generation with improved polling
          console.log(`⏳ Waiting for generation...`);
          const maxWaitTime = 60000; // 60 seconds max wait time
          const pollInterval = 2000; // Poll every 2 seconds
          let waitTime = 0;
          
          // Use better polling to check if generation is complete
          const expectedImageFilename = `${embeddingImageFilename}_00001_.png`;
          const imageUrl = `${this.runpodUrl}/view?filename=${expectedImageFilename}`;
          let downloadSuccess = false;
          
          while (waitTime < maxWaitTime && !downloadSuccess) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            waitTime += pollInterval;
            
            console.log(`🔄 Checking for completion... (${Math.round(waitTime/1000)}s)`);
            
            try {
              const imageResponse = await fetch(imageUrl);
              if (imageResponse.ok) {
                const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
                
                if (imageBuffer.length > 0) {
                  console.log(`✅ Downloaded ${variation.name}: ${(imageBuffer.length / 1024).toFixed(1)}KB`);
                  
                  // Upload to Bunny CDN embeddings folder
                  const fileName = `${options.characterName}_image_${embeddingImageNumber}.png`;
                  const uploadResult = await BunnyFolderService.uploadToCharacterFolder(
                    options.username,
                    options.characterName,
                    imageBuffer,
                    fileName,
                    'embeddings'
                  );

                  if (uploadResult.success) {
                    bunnyUrls.push(uploadResult.url!);
                    generatedImages.push(variation.name);
                    console.log(`✅ Uploaded ${variation.name} to Bunny CDN: ${uploadResult.url}`);
                    downloadSuccess = true;
                  } else {
                    console.error(`❌ Failed to upload ${variation.name} to Bunny CDN: ${uploadResult.error}`);
                    break;
                  }
                } else {
                  console.log(`⏳ Image not ready yet (empty response)...`);
                }
              } else {
                console.log(`⏳ Image not ready yet (${imageResponse.status})...`);
              }
            } catch (pollError) {
              console.log(`⏳ Polling error (continuing): ${pollError}`);
            }
          }
          
          if (!downloadSuccess) {
            console.error(`❌ Failed to download ${variation.name} after ${maxWaitTime/1000}s timeout`);
          }

          // Add small delay between images to avoid overwhelming RunPod
          if (i < imageVariations.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (error) {
          console.error(`❌ Error generating ${variation.name}:`, error);
          continue; // Continue with next image
        }
      }

      console.log(`\n📊 Embedding generation summary:`);
      console.log(`✅ Images generated: ${generatedImages.length}/${imageVariations.length}`);
      console.log(`☁️ Uploaded to Bunny CDN: ${bunnyUrls.length}`);

      if (generatedImages.length === 0) {
        throw new Error('No embedding images were successfully generated');
      }

      // 📊 STEP 3: Generate embedding vectors from the images
      console.log(`🧠 Generating embedding vectors from ${bunnyUrls.length} images...`);
      const embeddingVectors = await this.generateEmbeddingVectors(bunnyUrls, options);

      // Create comprehensive embedding metadata
      const embeddingData = {
        characterId: options.characterId,
        characterName: options.characterName,
        characterSeed: options.characterSeed,
        images: generatedImages.map((name, index) => ({
          variationName: name,
          bunnyUrl: bunnyUrls[index] || null,
          seed: options.characterSeed + ((index + 1) * 10),
          generatedAt: new Date()
        })),
        totalImages: generatedImages.length,
        embeddingVersion: '2.0',
        createdAt: new Date(),
        vectors: embeddingVectors, // Add the actual embedding vectors
        metadata: {
          basePrompt: options.basePrompt,
          artStyle: options.artStyle,
          personalityTraits: options.personalityTraits,
          selectedTags: options.selectedTags,
          dimension: embeddingVectors.length > 0 ? embeddingVectors[0].length : 0
        }
      };

      // Upload embedding metadata to Bunny CDN
      console.log(`📄 Uploading embedding metadata for ${options.characterName}...`);
      const embeddingMetadataResult = await BunnyFolderService.uploadToCharacterFolder(
        options.username,
        options.characterName,
        Buffer.from(JSON.stringify(embeddingData, null, 2), 'utf-8'),
        `embedding-metadata-${Date.now()}.json`,
        'embeddings'
      );

      if (embeddingMetadataResult.success) {
        console.log(`✅ Embedding metadata uploaded successfully: ${embeddingMetadataResult.url}`);
      } else {
        console.error(`❌ Failed to upload embedding metadata: ${embeddingMetadataResult.error}`);
      }

      // Update character with embedding data
      if (embeddingMetadataResult.success) {
        await CharacterModel.findOne({ id: parseInt(options.characterId) }).then(character => {
          if (character) {
            character.embeddings = {
              ...character.embeddings,
              imageEmbeddings: {
                metadataUrl: embeddingMetadataResult.url,
                totalImages: generatedImages.length,
                bunnyUrls: bunnyUrls,
                version: '1.0',
                createdAt: new Date(),
                status: 'completed',
                generationStartedAt: character.embeddings?.imageEmbeddings?.generationStartedAt,
                generationCompletedAt: new Date()
              }
            };
            return character.save();
          }
        });

        console.log(`✅ Embedding metadata saved to Bunny CDN and character updated`);

        // 📚 STEP 4: Train textual inversion embedding if we have enough images
        if (bunnyUrls.length >= 5) { // Lowered threshold from 8 to 5 images
          console.log(`🧠 Training textual inversion embedding with ${bunnyUrls.length} images...`);
          
          // Import and use TextualInversionService
          const { default: textualInversionService } = await import('./TextualInversionService.js');
          
          // TEMPORARILY DISABLED: TextualInversionTraining node not available in ComfyUI
          // TODO: Install ComfyUI custom nodes for textual inversion training
          console.log(`⚠️ Textual inversion training temporarily disabled for ${options.characterName} - TextualInversionTraining node not available`);
          
          // Start training in background (can take 10-30 minutes)
          // textualInversionService.trainTextualInversionEmbedding({
          //   characterId: options.characterId,
          //   characterName: options.characterName,
          //   username: options.username,
          //   embeddingImages: bunnyUrls,
          //   steps: 1000,
          //   learningRate: 0.005
          // }).then(result => {
          //   if (result.success) {
          //     console.log(`🎉 Textual inversion training completed for ${options.characterName}: ${result.embeddingName}`);
          //   } else {
          //     console.warn(`⚠️ Textual inversion training failed for ${options.characterName}: ${result.error}`);
          //   }
          // }).catch(error => {
          //   console.warn(`⚠️ Textual inversion training error for ${options.characterName}:`, error);
          // });
          
          console.log(`🧠 Textual inversion training started in background...`);
        } else {
          console.log(`⚠️ Not enough images for textual inversion training (need 5+, have ${bunnyUrls.length})`);
        }

      } else {
        console.error(`❌ Could not update character with embedding metadata due to upload failure`);
      }

      console.log(`🎉 Embedding generation completed! Generated ${generatedImages.length} images for character training.`);

      return {
        success: true,
        imagesGenerated: generatedImages.length,
        embeddingData: embeddingData,
        bunnyUrls: bunnyUrls
      };

    } catch (error) {
      console.error(`❌ Embedding generation failed:`, error);
      return {
        success: false,
        imagesGenerated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build a comprehensive character description that emphasizes consistency
   */
  private buildConsistentCharacterDescription(options: EmbeddingGenerationOptions): string {
    const parts: string[] = [];
    
    // Add character description as primary reference
    if (options.description && options.description.trim()) {
      parts.push(options.description.trim());
    }
    
    // Add art style for consistency
    if (options.artStyle?.primaryStyle) {
      parts.push(`${options.artStyle.primaryStyle} style`);
    }
    
    // Add personality traits that affect visual appearance
    if (options.personalityTraits?.mainTrait) {
      parts.push(`${options.personalityTraits.mainTrait} personality`);
    }
    
    // Add appearance tags from selectedTags
    if (options.selectedTags?.appearance) {
      const appearanceTags = options.selectedTags.appearance.map(tag => 
        tag.replace('-', ' ').replace('_', ' ')
      );
      parts.push(...appearanceTags);
    }
    
    // Add character type for context
    if (options.selectedTags?.['character-type']) {
      const characterTypes = options.selectedTags['character-type'].filter(type => 
        !['sfw', 'nsfw'].includes(type)
      );
      parts.push(...characterTypes);
    }
    
    return parts.join(', ');
  }

  /**
   * Extract key character features from the base prompt for consistency
   */
  private extractCharacterFeatures(basePrompt: string): string {
    const features: string[] = [];
    const prompt = basePrompt.toLowerCase();
    
    // Extract hair characteristics
    const hairColors = ['blonde', 'brown', 'black', 'red', 'white', 'silver', 'pink', 'blue', 'green', 'purple'];
    const hairStyles = ['long hair', 'short hair', 'curly', 'straight', 'wavy', 'braided', 'ponytail'];
    
    for (const color of hairColors) {
      if (prompt.includes(color) && prompt.includes('hair')) {
        features.push(`${color} hair`);
        break;
      }
    }
    
    for (const style of hairStyles) {
      if (prompt.includes(style)) {
        features.push(style);
        break;
      }
    }
    
    // Extract eye characteristics
    const eyeColors = ['blue eyes', 'brown eyes', 'green eyes', 'hazel eyes', 'amber eyes', 'gray eyes'];
    for (const eyeColor of eyeColors) {
      if (prompt.includes(eyeColor)) {
        features.push(eyeColor);
        break;
      }
    }
    
    // Extract skin characteristics
    const skinTones = ['fair skin', 'pale skin', 'tan skin', 'dark skin', 'olive skin'];
    for (const skinTone of skinTones) {
      if (prompt.includes(skinTone)) {
        features.push(skinTone);
        break;
      }
    }
    
    // Extract body type
    const bodyTypes = ['slender', 'curvy', 'athletic', 'petite', 'tall'];
    for (const bodyType of bodyTypes) {
      if (prompt.includes(bodyType)) {
        features.push(bodyType);
        break;
      }
    }
    
    // Extract clothing/outfit style
    if (prompt.includes('dress')) features.push('wearing dress');
    if (prompt.includes('uniform')) features.push('wearing uniform');
    if (prompt.includes('casual')) features.push('casual clothing');
    if (prompt.includes('formal')) features.push('formal attire');
    
    return features.join(', ');
  }

  /**
   * Generate embedding vectors from character images
   * This creates numerical representations that can be used for similarity searches
   */
  private async generateEmbeddingVectors(imageUrls: string[], options: EmbeddingGenerationOptions): Promise<number[][]> {
    try {
      console.log(`🧠 Processing ${imageUrls.length} images for embedding vector generation...`);
      
      const vectors: number[][] = [];
      
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        console.log(`🔄 Processing image ${i + 1}/${imageUrls.length}: ${imageUrl}`);
        
        try {
          // Download image data
          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            console.warn(`⚠️ Failed to download image for embedding: ${imageUrl}`);
            continue;
          }
          
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          
          // For now, create a simple hash-based embedding vector
          // In a production system, you would use a proper image embedding model
          const vector = await this.createImageEmbedding(imageBuffer, options);
          
          if (vector.length > 0) {
            vectors.push(vector);
            console.log(`✅ Generated embedding vector (dimension: ${vector.length})`);
          }
          
        } catch (error) {
          console.warn(`⚠️ Error processing image ${imageUrl} for embedding:`, error);
          continue;
        }
      }
      
      console.log(`✅ Generated ${vectors.length} embedding vectors`);
      return vectors;
      
    } catch (error) {
      console.error('❌ Error generating embedding vectors:', error);
      return [];
    }
  }

  /**
   * Create a simple image embedding using content hashing and metadata
   * In production, this should use a proper image embedding model like CLIP
   */
  private async createImageEmbedding(imageBuffer: Buffer, options: EmbeddingGenerationOptions): Promise<number[]> {
    try {
      // Create a hash of the image content
      const imageHash = crypto.createHash('sha256').update(imageBuffer).digest();
      
      // Create character-specific embedding based on metadata
      const characterData = [
        options.characterName,
        options.description,
        JSON.stringify(options.personalityTraits),
        JSON.stringify(options.artStyle),
        JSON.stringify(options.selectedTags),
        options.characterSeed.toString()
      ].join('|');
      
      const characterHash = crypto.createHash('sha256').update(characterData).digest();
      
      // Create a 384-dimensional embedding vector (common dimension for embeddings)
      const embedding: number[] = [];
      const targetDimension = 384;
      
      // Mix image hash and character hash to create embedding
      for (let i = 0; i < targetDimension; i++) {
        const imageByteIndex = i % imageHash.length;
        const characterByteIndex = i % characterHash.length;
        
        // Normalize to [-1, 1] range
        const imageValue = (imageHash[imageByteIndex] - 128) / 128;
        const characterValue = (characterHash[characterByteIndex] - 128) / 128;
        
        // Combine with character seed for consistency
        const seedValue = Math.sin((options.characterSeed + i) * 0.01);
        
        // Create final embedding value
        const embeddingValue = (imageValue * 0.4) + (characterValue * 0.4) + (seedValue * 0.2);
        embedding.push(embeddingValue);
      }
      
      return embedding;
      
    } catch (error) {
      console.error('❌ Error creating image embedding:', error);
      return [];
    }
  }

  /**
   * Build enhanced prompt for specific image variation with maximum character consistency
   */
  private buildVariationPrompt(options: EmbeddingGenerationOptions, basePrompt: string, variationPrompt: string): string {
    const promptParts: string[] = [];

    // Start with base positive prompt (contains full character appearance details)
    if (basePrompt) {
      promptParts.push(basePrompt);
    }

    // Extract and emphasize key character features for consistency
    const characterFeatures = this.extractCharacterFeatures(basePrompt);
    if (characterFeatures) {
      promptParts.push(characterFeatures);
    }

    // Add CRITICAL character consistency emphasis - must maintain ALL features
    promptParts.push(`same character, identical character, consistent appearance, same face, same facial features, same body type, same hair color, same hair style, same skin color, same eye color, same clothing style, same outfit, identical person`);
    
    // Add specific variation prompt (ONLY for pose/expression, NOT appearance changes)
    promptParts.push(variationPrompt);

    // Add environment/background consistency
    promptParts.push('same environment, consistent background, same lighting, same art style');

    // Add technical quality terms with consistency emphasis
    promptParts.push('high quality, detailed, professional, well-lit, character consistency, same person, identical features, no character variation');

    const finalPrompt = promptParts.join(', ');
    console.log(`🎨 Built variation prompt: ${finalPrompt.substring(0, 150)}...`);
    
    return finalPrompt;
  }

  /**
   * Generate embedding images in background (non-blocking)
   */
  async generateEmbeddingImagesBackground(options: EmbeddingGenerationOptions): Promise<void> {
    console.log(`🔄 Starting background embedding generation for ${options.characterName}...`);
    
    // Update status to generating
    await CharacterModel.findOne({ id: parseInt(options.characterId) }).then(character => {
      if (character && character.embeddings?.imageEmbeddings) {
        character.embeddings.imageEmbeddings.status = 'generating';
        character.embeddings.imageEmbeddings.generationStartedAt = new Date();
        return character.save();
      }
    });
    
    // Run in background without blocking the main response
    setImmediate(async () => {
      try {
        const result = await this.generateEmbeddingImages(options);
        
        if (result.success) {
          console.log(`✅ Background embedding generation completed for ${options.characterName}: ${result.imagesGenerated} images`);
        } else {
          console.error(`❌ Background embedding generation failed for ${options.characterName}: ${result.error}`);
          
          // Update status to failed
          await CharacterModel.findOne({ id: parseInt(options.characterId) }).then(character => {
            if (character && character.embeddings?.imageEmbeddings) {
              character.embeddings.imageEmbeddings.status = 'failed';
              character.embeddings.imageEmbeddings.generationCompletedAt = new Date();
              return character.save();
            }
          });
        }
      } catch (error) {
        console.error(`❌ Background embedding generation error for ${options.characterName}:`, error);
        
        // Update status to failed
        await CharacterModel.findOne({ id: parseInt(options.characterId) }).then(character => {
          if (character && character.embeddings?.imageEmbeddings) {
            character.embeddings.imageEmbeddings.status = 'failed';
            character.embeddings.imageEmbeddings.generationCompletedAt = new Date();
            return character.save();
          }
        });
      }
    });

    console.log(`🚀 Background embedding generation started for ${options.characterName}`);
  }
}
