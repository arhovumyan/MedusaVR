import 'dotenv/config';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { UserModel } from '../db/models/UserModel.js';
import { BunnyFolderService } from './BunnyFolderService.js';
import { BunnyStorageService } from './BunnyStorageService.js';
import { ImageIndexManager } from './ImageIndexManager.js';
import textualInversionService from './TextualInversionService.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { ContentSafetyService } from './ContentSafetyService.js';

export interface EmbeddingBasedGenerationOptions {
  characterId: string;
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  quantity?: number; // Number of images to generate
  currentUserId?: string; // The user who is generating the image (may be different from character creator)
  immediateResponse?: boolean; // Return RunPod URLs immediately without waiting for Cloudinary upload
  useGothicLora?: boolean; // Enable Gothic LoRA style
  loraStrength?: number; // LoRA strength (0.1-1.5, default 0.8)
  loraModel?: string; // LoRA model filename for new LoRA system
  artStyle?: string; // Art style to determine RunPod endpoint and model selection
}

export interface EmbeddingGenerationResult {
  success: boolean;
  imageUrls?: string[]; // Array of generated image URLs
  imageUrl?: string; // Keep for backward compatibility
  generationTime?: number;
  error?: string;
  usedEmbedding?: boolean;
  generatedCount?: number; // How many images were actually generated
}

export class EmbeddingBasedImageGenerationService {
  private runpodUrl: string;

  constructor() {
    // Default to anime/cartoon/fantasy URL for backward compatibility
    this.runpodUrl = process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL || 
                     process.env.RUNPOD_WEBUI_URL || 
                     'https://4mm1jblh0l3mv2-7861.proxy.runpod.net';
  }

  /**
   * Get the appropriate WebUI URL based on art style
   * Uses the same logic as RunPodService
   */
  private getWebUIUrlForStyle(style?: string): string {
    if (!style) {
      return this.runpodUrl; // Use default URL
    }

    switch (style.toLowerCase()) {
      case 'realistic':
        return process.env.RUNPOD_REALISTIC_URL || this.runpodUrl;
      case 'anime':
      case 'cartoon':
      case 'fantasy':
      default:
        return process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL || 
               process.env.RUNPOD_WEBUI_URL || 
               this.runpodUrl;
    }
  }

  /**
   * Get the appropriate model checkpoint for a given art style
   * Uses the same logic as RunPodService
   */
  private getModelForArtStyle(style?: string): string {
    if (!style) {
      return 'diving.safetensors'; // Default model
    }

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
   * Generate an image using character embeddings for consistency
   */
  async generateImageWithEmbedding(options: EmbeddingBasedGenerationOptions): Promise<EmbeddingGenerationResult> {
    const startTime = Date.now();
    const quantity = options.quantity || 1;
    
    try {
      console.log(`🎨 Generating ${quantity} image(s) with embedding for character: ${options.characterId}`);

      // 1. Get character data and check embedding status
      const character = await CharacterModel.findOne({ id: parseInt(options.characterId) });
      if (!character) {
        throw new Error('Character not found');
      }

      console.log(`📋 Character found: ${character.name}`);

      // 2. Check if embeddings are available
      const embeddingData = character.embeddings?.imageEmbeddings;
      const textualInversionData = character.embeddings?.textualInversion;
      let useEmbedding = false;
      let embeddingPrompt = '';

      // Check for textual inversion embedding first (more advanced)
      if (textualInversionData && textualInversionData.embeddingName) {
        console.log(`🧠 Character has trained textual inversion embedding: ${textualInversionData.embeddingName}`);
        useEmbedding = true;
        embeddingPrompt = this.buildEmbeddingPrompt(character, options.prompt);
      } else if (embeddingData && embeddingData.status === 'completed' && embeddingData.totalImages >= 5) {
        console.log(`✅ Character has image embeddings (${embeddingData.totalImages} images)`);
        
        // Check if we should trigger textual inversion training
        const shouldTrainEmbedding = embeddingData.bunnyUrls && embeddingData.bunnyUrls.length >= 8;
        
        if (shouldTrainEmbedding) {
          console.log(`🧠 Triggering background textual inversion training...`);
          // Trigger training in background (non-blocking)
          textualInversionService.generateEmbeddingBackground(options.characterId).catch(error => {
            console.warn(`⚠️ Background embedding training failed:`, error);
          });
        }
        
        useEmbedding = true;
        embeddingPrompt = this.buildEmbeddingPrompt(character, options.prompt);
      } else {
        console.log(`⚠️ No embeddings available, using standard generation`);
        embeddingPrompt = this.buildStandardPrompt(character, options.prompt);
      }

      console.log(`🎯 Final prompt: ${embeddingPrompt.substring(0, 150)}...`);

      // 2.5 CRITICAL: Content Safety Check
      console.log(`🛡️ Performing content safety check...`);
      const safetyResult = await ContentSafetyService.checkPromptSafety(embeddingPrompt, options.currentUserId);
      
      if (!safetyResult.allowed) {
        console.error(`🚨 CONTENT BLOCKED: Safety violations detected`);
        console.error(`Violations:`, safetyResult.violations);
        
        // Log for compliance and monitoring
        const criticalViolations = safetyResult.violations.filter(v => v.severity === 'CRITICAL');
        if (criticalViolations.length > 0) {
          console.error(`🚨 CRITICAL SAFETY VIOLATION - User ${options.currentUserId} - Character ${options.characterId}`);
        }
        
        throw new Error(`Content blocked due to safety violations: ${safetyResult.violations.map(v => v.reason).join(', ')}`);
      }
      
      if (safetyResult.warnings.length > 0) {
        console.warn(`⚠️ Content warnings:`, safetyResult.warnings);
      }

      // 3. Get username for folder structure - ALWAYS use premade_characters folder
      const currentUserId = options.currentUserId;
      let username: string;
      
      if (currentUserId) {
        const currentUser = await UserModel.findById(currentUserId);
        if (!currentUser) {
          throw new Error(`Current user not found: ${currentUserId}`);
        }
        username = currentUser.username;
        console.log(`📂 Using current user's folder: ${username}/premade_characters/`);
      } else {
        // Fallback to character creator (for backward compatibility)
        const user = await UserModel.findById(character.creatorId);
        if (!user) {
          throw new Error(`User not found for character creator ID: ${character.creatorId}`);
        }
        username = user.username;
        console.log(`📂 Using character creator's folder: ${username}/premade_characters/`);
      }

      // 4. Get the next batch of image indices using file-based system
      console.log(`🎯 Getting next image indices for batch of ${quantity} images...`);
      const batchIndices = await ImageIndexManager.getNextBatchIndices(username, character.name, quantity);
      console.log(`📊 Reserved indices: [${batchIndices.join(', ')}]`);

      // 5. Generate multiple images with controlled concurrency to avoid overwhelming RunPod
      const imagePromises: Promise<string>[] = [];
      const maxConcurrency = 3; // Limit concurrent generations to avoid RunPod overload
      
      console.log(`🚀 Starting generation of ${quantity} images...`);
      
      // For batch generation with quantity > 1, we need to handle this differently
      // We'll generate all images first, then download the specific ones based on indices
      if (quantity > 1) {
        console.log(`🎯 Batch generation mode: generating ${quantity} images then downloading based on reserved indices`);
        
        // Step 1: Generate all images by submitting workflows
        const workflowPromises: Promise<string>[] = [];
        for (let i = 0; i < quantity; i++) {
          const displayIndex = i + 1;
          const reservedIndex = batchIndices[i];
          console.log(`📋 Submitting workflow ${displayIndex}/${quantity} with reserved index ${reservedIndex}`);
          
          // Submit workflow but don't download yet - just get the prompt ID
          workflowPromises.push(this.submitSingleWorkflow(character, embeddingPrompt, options, displayIndex, username, reservedIndex));
        }
        
        // Wait for all workflow submissions
        const workflowResults = await Promise.allSettled(workflowPromises);
        const successfulWorkflows = workflowResults.filter(result => result.status === 'fulfilled').length;
        console.log(`📊 Workflow submission results: ${successfulWorkflows}/${quantity} successful`);
        
        if (successfulWorkflows === 0) {
          throw new Error('All workflow submissions failed');
        }
        
        // Step 2: Wait a bit for generation to complete
        console.log(`⏳ Waiting for ComfyUI to complete all ${successfulWorkflows} image generations...`);
        await new Promise(resolve => setTimeout(resolve, 20000)); // Wait 20 seconds for generation
        
        // Step 3: Download specific images based on reserved indices
        const baseFilename = `${username}_${character.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}_image`;
        const downloadedImages = await this.downloadBatchImages(character, baseFilename, batchIndices, username, quantity);
        
        if (downloadedImages.length === 0) {
          throw new Error('Failed to download any generated images from batch');
        }
        
        const generationTime = Math.round((Date.now() - startTime) / 1000);
        console.log(`🎉 Batch generation completed in ${generationTime} seconds! Downloaded: ${downloadedImages.length}/${quantity}`);

        return {
          success: true,
          imageUrls: downloadedImages,
          imageUrl: downloadedImages[0], // First image for backward compatibility
          generationTime: generationTime,
          usedEmbedding: useEmbedding,
          generatedCount: downloadedImages.length
        };
      }
      
      // Single image generation - use existing logic
      console.log(`🖼️ Single image generation mode`);
      const singleImageUrl = await this.generateSingleImage(character, embeddingPrompt, options, 1, username, options.immediateResponse || false, batchIndices[0]);
      
      const singleGenerationTime = Math.round((Date.now() - startTime) / 1000);
      return {
        success: true,
        imageUrls: [singleImageUrl],
        imageUrl: singleImageUrl,
        generationTime: singleGenerationTime,
        usedEmbedding: useEmbedding,
        generatedCount: 1
      };

    } catch (error) {
      console.error(`❌ Embedding-based image generation failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        usedEmbedding: false,
        generatedCount: 0
      };
    }
  }

  /**
   * Submit a single workflow to ComfyUI without downloading the result
   * Returns the prompt ID for tracking
   */
  private async submitSingleWorkflow(
    character: any, 
    embeddingPrompt: string, 
    options: EmbeddingBasedGenerationOptions,
    imageIndex: number,
    username: string,
    fileBasedIndex: number
  ): Promise<string> {
    console.log(`🖼️ Submitting workflow ${imageIndex} for ${character.name} with index ${fileBasedIndex}`);
    
    // Determine art style - prioritize options.artStyle, then character.artStyle.primaryStyle
    const artStyle = options.artStyle || character.artStyle?.primaryStyle || 'anime';
    console.log(`🎨 Art style: ${artStyle}`);
    
    // Get the appropriate RunPod URL for this art style
    const artStyleRunpodUrl = this.getWebUIUrlForStyle(artStyle);
    console.log(`🔗 Using RunPod URL: ${artStyleRunpodUrl}`);
    
    // Get the appropriate model for this art style
    const artStyleModel = this.getModelForArtStyle(artStyle);
    console.log(`🔧 Using model: ${artStyleModel}`);
    
    // Generate sanitized character name for consistent folder paths
    const sanitizedCharacterName = character.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const baseFilename = `${username}_${sanitizedCharacterName}_image`;
    
    // Build negative prompt using character's saved negative prompt
    let negativePrompt = this.buildNegativePrompt(character, options.negativePrompt || '');
    
    // Build ComfyUI workflow
    let workflow: any;
    
    // Check if character has textual inversion embedding
    const hasEmbedding = character.embeddings?.textualInversion?.embeddingName;
    const embeddingName = hasEmbedding ? character.embeddings.textualInversion.embeddingName : null;
    
    // Check for LoRA usage (new system takes precedence)
    const shouldUseLora = options.loraModel || options.useGothicLora;
    const loraFileName = options.loraModel || 'gothic.safetensors';
    
    if (shouldUseLora) {
      console.log(`🎨 Using LoRA: ${loraFileName} with strength: ${options.loraStrength || 0.8}`);
      if (hasEmbedding) {
        console.log(`🧠 Using textual inversion embedding: ${embeddingName}`);
      }
      
      // Workflow with LoRA nodes and optional textual inversion
      let nodeId = 0;
      let clipConnection = ["0", 1];
      
      workflow = {
        "prompt": {
          "0": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": { 
              "ckpt_name": character.imageGeneration?.model || artStyleModel 
            }
          }
        }
      };
      nodeId = 1;

      // Add textual inversion loader if embedding exists
      if (hasEmbedding && embeddingName) {
        workflow.prompt[nodeId.toString()] = {
          "class_type": "TextualInversionLoader",
          "inputs": {
            "clip": clipConnection,
            "embedding_name": `${embeddingName}.safetensors`
          }
        };
        clipConnection = [nodeId.toString(), 0];
        nodeId++;
      }

      // Add LoRA loader
      workflow.prompt[nodeId.toString()] = {
        "class_type": "LoraLoader",
        "inputs": {
          "model": ["0", 0],
          "clip": clipConnection,
          "lora_name": loraFileName,
          "strength_model": options.loraStrength || 0.8,
          "strength_clip": options.loraStrength || 0.8
        }
      };
      const loraNodeId = nodeId;
      nodeId++;

      // Text encoding with modified CLIP
      workflow.prompt[nodeId.toString()] = {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "clip": [loraNodeId.toString(), 1], // Use LoRA-modified CLIP
          "text": embeddingPrompt
        }
      };
      const positiveNodeId = nodeId;
      nodeId++;

      workflow.prompt[nodeId.toString()] = {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "clip": [loraNodeId.toString(), 1], // Use LoRA-modified CLIP
          "text": negativePrompt
        }
      };
      const negativeNodeId = nodeId;
      nodeId++;

      // Rest of the workflow
      workflow.prompt[nodeId.toString()] = {
        "class_type": "EmptyLatentImage",
        "inputs": { 
          "width": options.width || 1024, 
          "height": options.height || 1536,
          "batch_size": 1 
        }
      };
      const latentNodeId = nodeId;
      nodeId++;

      workflow.prompt[nodeId.toString()] = {
        "class_type": "KSampler",
        "inputs": {
          "model": [loraNodeId.toString(), 0], // Use LoRA-modified model
          "positive": [positiveNodeId.toString(), 0],
          "negative": [negativeNodeId.toString(), 0],
          "latent_image": [latentNodeId.toString(), 0],
          "steps": options.steps || 35,
          "cfg": options.cfgScale || 8,
          "sampler_name": "dpmpp_2m",
          "scheduler": "karras",
          "denoise": 1.0,
          "seed": Math.floor(Math.random() * 9999999999)
        }
      };
      const samplerNodeId = nodeId;
      nodeId++;

      workflow.prompt[nodeId.toString()] = {
        "class_type": "VAEDecode",
        "inputs": { "samples": [samplerNodeId.toString(), 0], "vae": ["0", 2] }
      };
      const vaeNodeId = nodeId;
      nodeId++;

      workflow.prompt[nodeId.toString()] = {
        "class_type": "SaveImage",
        "inputs": {
          "images": [vaeNodeId.toString(), 0],
          "filename_prefix": baseFilename,
          "increment_index": true,
          "save_metadata": false
        }
      };
    } else {
      // Standard workflow without LoRA but with optional textual inversion
      if (hasEmbedding) {
        console.log(`🧠 Using textual inversion embedding: ${embeddingName}`);
      }
      
      let nodeId = 0;
      let clipConnection = ["0", 1];
      
      workflow = {
        "prompt": {
          "0": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": { 
              "ckpt_name": character.imageGeneration?.model || artStyleModel
            }
          }
        }
      };
      nodeId = 1;

      // Add textual inversion loader if embedding exists
      if (hasEmbedding && embeddingName) {
        workflow.prompt[nodeId.toString()] = {
          "class_type": "TextualInversionLoader",
          "inputs": {
            "clip": clipConnection,
            "embedding_name": `${embeddingName}.safetensors`
          }
        };
        clipConnection = [nodeId.toString(), 0];
        nodeId++;
      }

      // Text encoding
      workflow.prompt[nodeId.toString()] = {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "clip": clipConnection,
          "text": embeddingPrompt
        }
      };
      const positiveNodeId = nodeId;
      nodeId++;

      workflow.prompt[nodeId.toString()] = {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "clip": clipConnection,
          "text": negativePrompt
        }
      };
      const negativeNodeId = nodeId;
      nodeId++;

      // Rest of the workflow
      workflow.prompt[nodeId.toString()] = {
        "class_type": "EmptyLatentImage",
        "inputs": { 
          "width": options.width || 1024, 
          "height": options.height || 1536,
          "batch_size": 1 
        }
      };
      const latentNodeId = nodeId;
      nodeId++;

      workflow.prompt[nodeId.toString()] = {
        "class_type": "KSampler",
        "inputs": {
          "model": ["0", 0],
          "positive": [positiveNodeId.toString(), 0],
          "negative": [negativeNodeId.toString(), 0],
          "latent_image": [latentNodeId.toString(), 0],
          "steps": options.steps || 35,
          "cfg": options.cfgScale || 8,
          "sampler_name": "dpmpp_2m",
          "scheduler": "karras",
          "denoise": 1.0,
          "seed": Math.floor(Math.random() * 9999999999)
        }
      };
      const samplerNodeId = nodeId;
      nodeId++;

      workflow.prompt[nodeId.toString()] = {
        "class_type": "VAEDecode",
        "inputs": { "samples": [samplerNodeId.toString(), 0], "vae": ["0", 2] }
      };
      const vaeNodeId = nodeId;
      nodeId++;

      workflow.prompt[nodeId.toString()] = {
        "class_type": "SaveImage",
        "inputs": {
          "images": [vaeNodeId.toString(), 0],
          "filename_prefix": baseFilename,
          "increment_index": true,
          "save_metadata": false
        }
      };
    }

    // Submit workflow to RunPod
    console.log(`🚀 Sending workflow ${imageIndex} to RunPod...`);
    
    // Normalize URL to avoid double slashes
    const normalizedUrl = artStyleRunpodUrl.endsWith('/') ? artStyleRunpodUrl.slice(0, -1) : artStyleRunpodUrl;
    const response = await fetch(`${normalizedUrl}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflow)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`RunPod request failed for workflow ${imageIndex}: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json() as any;
    
    if (!responseData.prompt_id) {
      throw new Error(`No prompt_id received from RunPod for workflow ${imageIndex}`);
    }

    console.log(`✅ Workflow ${imageIndex} submitted. Prompt ID: ${responseData.prompt_id}`);
    return responseData.prompt_id;
  }

  /**
   * Generate a single image with immediate RunPod URL return + background Cloudinary upload
   */
  private async generateSingleImage(
    character: any, 
    embeddingPrompt: string, 
    options: EmbeddingBasedGenerationOptions,
    imageIndex: number,
    username: string, // Pass username directly to avoid duplicate lookups
    returnImmediateUrl: boolean = false, // New option to return RunPod URL immediately
    fileBasedIndex?: number // Index from the file-based system
  ): Promise<string> {
    try {
      console.log(`🖼️ Generating image ${imageIndex} for ${character.name}`);
      
      // Determine art style - prioritize options.artStyle, then character.artStyle.primaryStyle
      const artStyle = options.artStyle || character.artStyle?.primaryStyle || 'anime';
      console.log(`🎨 Art style: ${artStyle}`);
      
      // Get the appropriate RunPod URL for this art style
      const artStyleRunpodUrl = this.getWebUIUrlForStyle(artStyle);
      console.log(`🔗 Using RunPod URL: ${artStyleRunpodUrl}`);
      
      // Get the appropriate model for this art style
      const artStyleModel = this.getModelForArtStyle(artStyle);
      console.log(`🔧 Using model: ${artStyleModel}`);
      
      // Generate sanitized character name for consistent folder paths
      const sanitizedCharacterName = character.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      console.log(`📂 Using folder: ${username}/premade_characters/${sanitizedCharacterName}/images`);

      // Let ComfyUI generate its own filename - just use a simple base
      const baseFilename = `${username}_${sanitizedCharacterName}_image`;

      console.log(`📝 Using base filename for image ${imageIndex}: ${baseFilename} (ComfyUI will add its own numbering)`);

      // Build negative prompt using character's saved negative prompt
      let negativePrompt = this.buildNegativePrompt(character, options.negativePrompt || '');

      console.log(`📝 Generated negative prompt for image ${imageIndex}: ${negativePrompt.substring(0, 100)}...`);

      // Build ComfyUI workflow
      let workflow: any;
      
      // Check for LoRA usage (new system takes precedence)
      const shouldUseLora = options.loraModel || options.useGothicLora;
      const loraFileName = options.loraModel || 'gothic.safetensors';
      
      if (shouldUseLora) {
        console.log(`🎨 Using LoRA: ${loraFileName} with strength: ${options.loraStrength || 0.8}`);
        
        // Workflow with LoRA nodes
        workflow = {
          "prompt": {
            "0": {
              "class_type": "CheckpointLoaderSimple",
              "inputs": { 
                "ckpt_name": character.imageGeneration?.model || artStyleModel
              }
            },
            "7": {
              "class_type": "LoraLoader",
              "inputs": {
                "model": ["0", 0],
                "clip": ["0", 1],
                "lora_name": loraFileName,
                "strength_model": options.loraStrength || 0.8,
                "strength_clip": options.loraStrength || 0.8
              }
            },
            "1": {
              "class_type": "CLIPTextEncode",
              "inputs": {
                "clip": ["7", 1], // Use LoRA-modified CLIP
                "text": embeddingPrompt
              }
            },
            "2": {
              "class_type": "CLIPTextEncode",
              "inputs": {
                "clip": ["7", 1], // Use LoRA-modified CLIP
                "text": negativePrompt
              }
            },
            "3": {
              "class_type": "EmptyLatentImage",
              "inputs": { 
                "width": options.width || 1024, 
                "height": options.height || 1536, 
                "batch_size": 1 
              }
            },
            "4": {
              "class_type": "KSampler",
              "inputs": {
                "model": ["7", 0], // Use LoRA-modified model
                "positive": ["1", 0],
                "negative": ["2", 0],
                "latent_image": ["3", 0],
                "steps": options.steps || 35,
                "cfg": options.cfgScale || 8,
                "sampler_name": "dpmpp_2m_sde_gpu",
                "scheduler": "karras",
                "denoise": 1.0,
                "seed": (options.seed || Math.floor(Math.random() * 1000000)) + imageIndex
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
                "filename_prefix": baseFilename,
                "increment_index": true,
                "save_metadata": false
              }
            }
          }
        };
      } else {
        // Standard workflow without LoRA
        workflow = {
          "prompt": {
            "0": {
              "class_type": "CheckpointLoaderSimple",
              "inputs": { 
                "ckpt_name": character.imageGeneration?.model || artStyleModel
              }
            },
            "1": {
              "class_type": "CLIPTextEncode",
              "inputs": {
                "clip": ["0", 1],
                "text": embeddingPrompt
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
                "height": options.height || 1536, 
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
                "steps": options.steps || 35,
                "cfg": options.cfgScale || 8,
                "sampler_name": "dpmpp_2m_sde_gpu",
                "scheduler": "karras",
                "denoise": 1.0,
                "seed": (options.seed || Math.floor(Math.random() * 1000000)) + imageIndex
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
                "filename_prefix": baseFilename,
                "increment_index": true,
                "save_metadata": false
              }
            }
          }
        };
      }

      // Submit workflow to RunPod
      console.log(`🚀 Sending workflow ${imageIndex} to RunPod...`);
      console.log(`🔧 Workflow details:`, {
        filename: baseFilename,
        model: character.imageGeneration?.model || "diving.safetensors",
        dimensions: `${options.width || 1024}x${options.height || 1536}`,
        steps: options.steps || 35,
        promptLength: embeddingPrompt.length,
        negativePromptLength: negativePrompt.length,
        useGothicLora: options.useGothicLora || false,
        loraStrength: options.loraStrength || 0.8
      });
      
      // Normalize URL to avoid double slashes  
      const normalizedUrl = artStyleRunpodUrl.endsWith('/') ? artStyleRunpodUrl.slice(0, -1) : artStyleRunpodUrl;
      const response = await fetch(`${normalizedUrl}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ RunPod response error: ${response.status} ${response.statusText}`);
        console.log(`❌ Error details: ${errorText}`);
        throw new Error(`RunPod request failed for image ${imageIndex}: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json() as any;
      console.log(`📋 RunPod response:`, responseData);
      
      if (!responseData.prompt_id) {
        throw new Error(`No prompt_id received from RunPod for image ${imageIndex}. Response: ${JSON.stringify(responseData)}`);
      }

      console.log(`✅ Workflow ${imageIndex} submitted. Prompt ID: ${responseData.prompt_id}`);

      // Poll ComfyUI queue to wait for completion with faster polling
      const promptId = responseData.prompt_id;
      let queueComplete = false;
      let pollAttempts = 0;
      const maxPollAttempts = 45; // Reduced from potentially longer waits
      
      console.log(`⏳ Polling ComfyUI queue for prompt ${promptId}...`);
      
      while (!queueComplete && pollAttempts < maxPollAttempts) {
        try {
          const queueResponse = await fetch(`${artStyleRunpodUrl}/queue`);
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
          await new Promise(resolve => setTimeout(resolve, 1500)); // Reduced from 2s to 1.5s
          pollAttempts++;
        }
      }
      
      if (!queueComplete) {
        console.log(`⚠️ Queue polling timeout after ${maxPollAttempts} attempts, proceeding with file search anyway...`);
      }

      // Reduced wait for file system sync
      console.log(`⏳ Brief wait for file system sync...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2s to 1s

      // If immediate URL is requested, return RunPod URL immediately and queue background upload
      if (returnImmediateUrl) {
        return this.handleImmediateImageResponse(character, baseFilename, imageIndex, username, fileBasedIndex, artStyleRunpodUrl);
      }

      // Otherwise, use the traditional full download + upload process
      return this.processImageWithFullDownload(character, baseFilename, imageIndex, username, fileBasedIndex, artStyleRunpodUrl);

    } catch (error) {
      console.error(`❌ Failed to generate image ${imageIndex}:`, error);
      throw error;
    }
  }

  /**
   * Handle immediate image response - returns RunPod URL and queues background Cloudinary upload
   */
  private async handleImmediateImageResponse(
    character: any,
    baseFilename: string,
    imageIndex: number,
    username: string,
    fileBasedIndex?: number, // Index from the file-based system
    runpodUrl?: string // URL for the specific art style
  ): Promise<string> {
    console.log(`🚀 Returning immediate RunPod URL for image ${imageIndex}`);
    
    // Find the latest image from RunPod without downloading all variations
    const latestImageUrl = await this.findLatestRunPodImage(baseFilename, runpodUrl);
    
    if (latestImageUrl) {
      // Queue background upload to Cloudinary
      this.queueBackgroundCloudinaryUpload({
        character,
        filename: baseFilename,
        imageIndex,
        username,
        runpodUrl: latestImageUrl,
        fileBasedIndex: fileBasedIndex // Pass file-based index
      });
      
      console.log(`✅ Returning immediate RunPod URL: ${latestImageUrl}`);
      return latestImageUrl;
    } else {
      console.log(`⚠️ Could not find immediate image, falling back to full download process`);
      // Fall back to the traditional download + upload process
      return this.processImageWithFullDownload(character, baseFilename, imageIndex, username, fileBasedIndex, runpodUrl);
    }
  }

  /**
   * Find the latest generated image on RunPod without downloading all variations
   */
  private async findLatestRunPodImage(filename: string, runpodUrl?: string): Promise<string | null> {
    try {
      const urlToUse = runpodUrl || this.runpodUrl; // Use provided URL or fallback to default
      // Check backwards from high numbers to find the latest image quickly
      for (let suffix = 50; suffix >= 1; suffix--) {
        const paddedSuffix = suffix.toString().padStart(5, '0');
        const expectedImageFilename = `${filename}_${paddedSuffix}_.png`;
        const imageUrl = `${urlToUse}/view?filename=${expectedImageFilename}`;
        
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' }); // Just check if exists
          if (response.ok) {
            console.log(`🎯 Found latest image: ${expectedImageFilename}`);
            return imageUrl;
          }
        } catch (error) {
          // Continue checking
        }
      }
      
      console.log(`⚠️ Could not find any generated images with pattern: ${filename}_*_.png`);
      return null;
    } catch (error) {
      console.log(`❌ Error finding latest RunPod image: ${error}`);
      return null;
    }
  }

  /**
   * Find a specific image by its index number
   */
  private async findSpecificImageByIndex(
    baseFilename: string, 
    targetIndex: number
  ): Promise<string | null> {
    // Convert index to ComfyUI suffix format (5-digit padding)
    const paddedSuffix = targetIndex.toString().padStart(5, '0');
    const expectedImageFilename = `${baseFilename}_${paddedSuffix}_.png`;
    const imageUrl = `${this.runpodUrl}/view?filename=${expectedImageFilename}`;
    
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`🎯 Found specific image for index ${targetIndex}: ${expectedImageFilename}`);
        return imageUrl;
      }
    } catch (error) {
      console.log(`⚠️ Could not find image for index ${targetIndex}: ${error}`);
    }
    return null;
  }

  /**
   * Download multiple images based on reserved batch indices
   */
  private async downloadBatchImages(
    character: any,
    baseFilename: string,
    batchIndices: number[],
    username: string,
    quantity: number
  ): Promise<string[]> {
    console.log(`🔄 Downloading batch images for indices: [${batchIndices.join(', ')}]`);
    const imageUrls: string[] = [];
    
    // Download images in reverse order (highest index first)
    // This matches user expectation: "download the last image (index.txt) and the one before that (index.txt-1)"
    const sortedIndices = [...batchIndices].sort((a, b) => b - a);
    
    for (let i = 0; i < Math.min(quantity, sortedIndices.length); i++) {
      const targetIndex = sortedIndices[i];
      const imageUrl = await this.findSpecificImageByIndex(baseFilename, targetIndex);
      
      if (imageUrl) {
        imageUrls.push(imageUrl);
        console.log(`✅ Found image ${i + 1}/${quantity} for index ${targetIndex}: ${imageUrl}`);
        
        // Queue background upload for this specific image
        this.queueBackgroundCloudinaryUpload({
          character,
          filename: baseFilename,
          imageIndex: i + 1,
          username,
          runpodUrl: imageUrl,
          fileBasedIndex: targetIndex
        });
      } else {
        console.warn(`⚠️ Could not find image for reserved index ${targetIndex}, trying fallback`);
        // If we can't find the specific index, fall back to traditional search
        const fallbackUrl = await this.findLatestRunPodImage(baseFilename);
        if (fallbackUrl) {
          imageUrls.push(fallbackUrl);
          console.log(`🔄 Using fallback image for index ${targetIndex}: ${fallbackUrl}`);
        }
      }
      
      // Add 1 second delay between downloads to prevent overwhelming the server
      if (i < Math.min(quantity, sortedIndices.length) - 1) {
        console.log(`⏱️ Waiting 1 second before downloading next image...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`🎉 Downloaded ${imageUrls.length}/${quantity} batch images successfully`);
    return imageUrls;
  }

  /**
   * Queue background upload to Cloudinary (non-blocking)
   */
  private queueBackgroundCloudinaryUpload(uploadData: {
    character: any;
    filename: string;
    imageIndex: number;
    username: string;
    runpodUrl: string;
    fileBasedIndex?: number; // Index from the file-based system
  }) {
    // Use setImmediate to queue this for the next event loop iteration
    setImmediate(async () => {
      const maxRetries = 2;
      let attempt = 0;
      
      while (attempt < maxRetries) {
        try {
          console.log(`🔄 Starting background Cloudinary upload for image ${uploadData.imageIndex} (attempt ${attempt + 1}/${maxRetries})...`);
          
          // Download the image from RunPod with timeout
          const downloadController = new AbortController();
          const downloadTimeout = setTimeout(() => downloadController.abort(), 15000); // 15s timeout
          
          const imageResponse = await fetch(uploadData.runpodUrl, {
            signal: downloadController.signal
          });
          clearTimeout(downloadTimeout);
          
          if (!imageResponse.ok) {
            throw new Error(`Failed to download image from RunPod: ${imageResponse.status}`);
          }
          
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          console.log(`📦 Downloaded image size: ${(imageBuffer.length / 1024).toFixed(1)}KB`);
          
          const actualFilename = uploadData.runpodUrl.split('filename=')[1];
          
          // Generate sequential filename for Cloudinary to prevent overwrites
          const sanitizedCharacterName = uploadData.character.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
          
          if (!uploadData.fileBasedIndex) {
            console.error(`❌ CRITICAL: No fileBasedIndex provided for image ${uploadData.imageIndex}! This could cause overwrites.`);
            console.error(`❌ uploadData:`, uploadData);
            throw new Error(`fileBasedIndex is required to prevent filename collisions`);
          }
          
          const sequenceNumber = uploadData.fileBasedIndex;
          const paddedSequenceNumber = sequenceNumber.toString().padStart(4, '0');
          const sequentialFilename = `${uploadData.username}_${sanitizedCharacterName}_image_${paddedSequenceNumber}.png`;
          
          console.log(`📝 Background upload using file-based filename: ${sequentialFilename} (was: ${actualFilename})`);
          console.log(`📊 File-based index: number=${sequenceNumber}, padded=${paddedSequenceNumber}`);
          
          // Upload to Cloudinary with timing
          const uploadStartTime = Date.now();
          const uploadResult = await BunnyFolderService.uploadToPremadeCharacterFolder(
            uploadData.username,
            sanitizedCharacterName, // Use sanitized name for consistency
            imageBuffer,
            sequentialFilename, // Use file-based sequential filename to prevent overwrites
            'images'
          );
          const uploadTime = Math.round((Date.now() - uploadStartTime) / 1000);
          
          if (uploadResult.success) {
            console.log(`✅ Background upload completed for image ${uploadData.imageIndex} in ${uploadTime}s: ${uploadResult.url}`);
            return; // Success, exit retry loop
          } else {
            throw new Error(uploadResult.error || 'Upload failed');
          }
        } catch (error) {
          attempt++;
          const isLastAttempt = attempt >= maxRetries;
          
          if (error instanceof Error && error.name === 'AbortError') {
            console.log(`⏰ Background upload timeout for image ${uploadData.imageIndex} (attempt ${attempt}/${maxRetries})`);
          } else {
            console.log(`❌ Background upload error for image ${uploadData.imageIndex} (attempt ${attempt}/${maxRetries}): ${error}`);
          }
          
          if (isLastAttempt) {
            console.log(`💀 Background upload failed permanently for image ${uploadData.imageIndex} after ${maxRetries} attempts`);
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
    });
  }

  /**
   * Process image with full download (fallback for when immediate URL fails)
   */
  /**
   * Efficiently find the latest image without downloading all variations
   * Uses binary search strategy to minimize network requests
   */
  private async findLatestImageEfficient(
    baseFilename: string,
    urlToUse: string,
    imageIndex: number,
    attempt: number
  ): Promise<{buffer: Buffer, filename: string} | null> {
    console.log(`🔍 Efficiently searching for latest image with pattern: ${baseFilename}_*_.png`);
    
    // Start from a reasonable high number and work backwards
    let startRange = 100; // Start checking from 100 downwards
    let endRange = 1;
    let found = false;
    
    // First, do a quick binary search to find the general range
    while (startRange > endRange && !found) {
      const midpoint = Math.floor((startRange + endRange) / 2);
      const paddedSuffix = midpoint.toString().padStart(5, '0');
      const expectedImageFilename = `${baseFilename}_${paddedSuffix}_.png`;
      const imageUrl = `${urlToUse}/view?filename=${expectedImageFilename}`;
      
      console.log(`🔍 Binary search checking: ${expectedImageFilename} (range: ${endRange}-${startRange})`);
      
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' }); // Use HEAD for faster check
        if (response.ok) {
          endRange = midpoint;
          found = true;
          break;
        } else {
          startRange = midpoint - 1;
        }
      } catch (error) {
        startRange = midpoint - 1;
      }
    }
    
    // If we found a range, now search backwards from the highest reasonable number
    let latestSuffix = 0;
    const maxCheck = found ? Math.min(startRange + 50, 200) : 100; // Don't check beyond reasonable limits
    
    console.log(`🔍 Reverse scanning from ${maxCheck} down to find latest image...`);
    
    for (let suffix = maxCheck; suffix >= 1; suffix--) {
      const paddedSuffix = suffix.toString().padStart(5, '0');
      const expectedImageFilename = `${baseFilename}_${paddedSuffix}_.png`;
      const imageUrl = `${urlToUse}/view?filename=${expectedImageFilename}`;
      
      try {
        const imageResponse = await fetch(imageUrl);
        
        if (imageResponse.ok) {
          const buffer = Buffer.from(await imageResponse.arrayBuffer());
          if (buffer.length > 0) {
            console.log(`🎯 Found latest image: ${expectedImageFilename} (scanned down from ${maxCheck})`);
            return { buffer, filename: expectedImageFilename };
          }
        }
      } catch (error) {
        // Continue searching
      }
    }
    
    console.log(`❌ No images found in efficient search (checked range 1-${maxCheck})`);
    return null;
  }

  private async processImageWithFullDownload(
    character: any,
    baseFilename: string,
    imageIndex: number,
    username: string,
    fileBasedIndex?: number, // Index from the file-based system
    runpodUrl?: string // URL for the specific art style
  ): Promise<string> {
    // Original image processing logic - download all variations and upload to Cloudinary
    const imageBuffers: Array<{buffer: Buffer, filename: string}> = [];
    
    console.log(`🔍 Looking for ComfyUI generated images with pattern: ${baseFilename}_*_.png`);
    
    const urlToUse = runpodUrl || this.runpodUrl; // Use provided URL or fallback to default
    
    // Retry mechanism - sometimes ComfyUI takes longer to save files
    let retryCount = 0;
    const maxRetries = 2; // Reduced from 3
    
    while (imageBuffers.length === 0 && retryCount < maxRetries) {
      if (retryCount > 0) {
        console.log(`🔄 Retry ${retryCount}/${maxRetries} - waiting additional 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Reduced from 3s
      }
      
      // Look for ComfyUI's automatic suffixed versions
      // We need to find ALL images to select the latest one, regardless of totalQuantity
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 3; // Stop if we hit 3 consecutive missing images
      const maxSuffixesToCheck = 0; // DISABLED: Use efficient search instead
      
      for (let suffix = 1; suffix <= maxSuffixesToCheck; suffix++) {
        const paddedSuffix = suffix.toString().padStart(5, '0');
        const expectedImageFilename = `${baseFilename}_${paddedSuffix}_.png`;
        const imageUrl = `${urlToUse}/view?filename=${expectedImageFilename}`;
        
        console.log(`🔍 Trying to download image ${imageIndex}, suffix ${suffix} (attempt ${retryCount + 1}): ${expectedImageFilename}`);
        
        try {
          const imageResponse = await fetch(imageUrl);
          
          if (imageResponse.ok) {
            const buffer = Buffer.from(await imageResponse.arrayBuffer());
            if (buffer.length > 0) {
              imageBuffers.push({buffer, filename: expectedImageFilename});
              console.log(`✅ Found image ${imageIndex} variation ${suffix}. Size: ${(buffer.length / 1024).toFixed(1)}KB`);
              consecutiveFailures = 0; // Reset counter on success
              
              // Continue looking for more variations to find the latest one
            } else {
              consecutiveFailures++;
            }
          } else {
            console.log(`⚠️ Image not ready yet: ${imageResponse.status} ${imageResponse.statusText}`);
            consecutiveFailures++;
          }
        } catch (error) {
          console.log(`⚠️ Failed to fetch ${expectedImageFilename}: ${error}`);
          consecutiveFailures++;
        }
        
        // If we hit too many consecutive failures, assume we've found all images
        if (consecutiveFailures >= maxConsecutiveFailures && imageBuffers.length > 0) {
          console.log(`� Stopping search after ${consecutiveFailures} consecutive failures. Found ${imageBuffers.length} images.`);
          break;
        }
      }
      
      // If no images found using the old method, use the efficient search
      if (imageBuffers.length === 0) {
        console.log(`🚀 Using efficient latest image search for: ${baseFilename}`);
        const latestImage = await this.findLatestImageEfficient(baseFilename, urlToUse, imageIndex, retryCount + 1);
        if (latestImage) {
          imageBuffers.push(latestImage);
          console.log(`✅ Found latest image efficiently: ${latestImage.filename}. Size: ${(latestImage.buffer.length / 1024).toFixed(1)}KB`);
        }
      }
      
      retryCount++;
    }
    
    if (imageBuffers.length === 0) {
      console.log(`❌ No images found after ${maxRetries} attempts. Checking what files exist on RunPod...`);
      throw new Error(`Failed to find any generated images for ${baseFilename} after ${maxRetries} retries using efficient search`);
    }

    // Use the last (latest) image found
    const latestImage = imageBuffers[imageBuffers.length - 1];
    console.log(`🎯 Using latest image: ${latestImage.filename} (${imageBuffers.length} total variations found)`);

    // Get the actual filename from RunPod (which includes suffix)
    const runpodFilename = latestImage.filename;
    
    // Generate sequential filename for Cloudinary to prevent overwrites
    const sanitizedCharacterName = character.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Use file-based index if provided, otherwise get next available
    const sequenceNumber = fileBasedIndex || 
      await ImageIndexManager.getNextIndex(username, character.name);
    const paddedSequenceNumber = sequenceNumber.toString().padStart(4, '0');
    const sequentialFilename = `${username}_${sanitizedCharacterName}_image_${paddedSequenceNumber}.png`;
    
    console.log(`📝 Upload filename: ${sequentialFilename} (was: ${runpodFilename})`);
    console.log(`📊 File-based index: number=${sequenceNumber}, padded=${paddedSequenceNumber}`);

    try {
      // Upload to Cloudinary
      const uploadResult = await BunnyFolderService.uploadToPremadeCharacterFolder(
        username,
        sanitizedCharacterName, // Use sanitized name for consistency
        latestImage.buffer,
        sequentialFilename, // Use file-based sequential filename to prevent overwrites
        'images'
      );

      if (uploadResult.success) {
        console.log(`✅ Image ${imageIndex} uploaded to Cloudinary: ${uploadResult.url}`);
        return uploadResult.url;
      } else {
        throw new Error(uploadResult.error || 'Cloudinary upload failed');
      }
    } catch (error) {
      console.error(`❌ Failed to upload image ${imageIndex} to Cloudinary:`, error);
      throw error;
    }
  }

  /**
   * Build prompt with embedding references for consistency
   */
  private buildEmbeddingPrompt(character: any, userPrompt: string): string {
    const promptParts: string[] = [];

    // Add quality enhancement prompts at the beginning
    promptParts.push('masterpiece', 'best quality', 'high resolution', 'extremely detailed', '8K', 'Full HD', 'detailed face', 'detailed eyes', 'detailed skin');

    // Check if character has trained textual inversion embedding
    const embeddingToken = character.embeddings?.textualInversion?.embeddingName;
    if (embeddingToken) {
      // Use the textual inversion token for character consistency
      promptParts.push(`<${embeddingToken}>`);
      console.log(`🧠 Using textual inversion embedding: <${embeddingToken}>`);
    }

    // Use character's original prompt from creation (includes positive prompt + art style + personality + tags)
    if (character.imageGeneration?.prompt) {
      promptParts.push(character.imageGeneration.prompt);
    } else {
      // Fallback to building from character data
      if (character.description) {
        promptParts.push(character.description.substring(0, 200));
      }
      
      if (character.personalityTraits?.mainTrait) {
        promptParts.push(character.personalityTraits.mainTrait);
      }
      
      if (character.artStyle?.primaryStyle) {
        promptParts.push(`${character.artStyle.primaryStyle} style`);
      }
    }

    // Add user's custom prompt for this specific image
    promptParts.push(userPrompt);

    // Add character consistency instruction (less needed with embeddings but still helpful)
    if (!embeddingToken) {
      promptParts.push('consistent character design', 'same character', 'character consistency');
    }

    // Add final quality enhancers
    promptParts.push('sharp focus', 'detailed face', 'beautiful eyes');

    return promptParts.join(', ');
  }

  /**
   * Build standard prompt without embedding references
   */
  private buildStandardPrompt(character: any, userPrompt: string): string {
    const promptParts: string[] = [];

    // Add quality enhancement prompts at the beginning
    promptParts.push('masterpiece', 'best quality', 'high resolution', 'extremely detailed', '8K', 'Full HD', 'detailed face', 'detailed eyes', 'detailed skin');

    // Use character's original prompt from creation (includes positive prompt + art style + personality + tags)
    if (character.imageGeneration?.prompt) {
      promptParts.push(character.imageGeneration.prompt);
    } else {
      // Fallback to building from character data
      if (character.description) {
        promptParts.push(character.description.substring(0, 200));
      }
      
      if (character.personalityTraits?.mainTrait) {
        promptParts.push(character.personalityTraits.mainTrait);
      }
      
      if (character.artStyle?.primaryStyle) {
        promptParts.push(`${character.artStyle.primaryStyle} style`);
      }
    }

    // Add user's custom prompt for this specific image
    promptParts.push(userPrompt);

    // Add final quality enhancers
    promptParts.push('sharp focus', 'detailed face', 'beautiful eyes');

    return promptParts.join(', ');
  }

  /**
   * Build negative prompt using character's saved negative prompt
   */
  private buildNegativePrompt(character: any, userNegativePrompt: string): string {
    const negParts: string[] = [];

    // Start with user's negative prompt for this specific image
    if (userNegativePrompt && userNegativePrompt.trim()) {
      negParts.push(userNegativePrompt.trim());
    }

    // Use character's original negative prompt from creation
    if (character.imageGeneration?.negativePrompt) {
      negParts.push(character.imageGeneration.negativePrompt);
    } else {
      // Fallback to standard negative prompts with enhanced quality filters
      negParts.push(
        'lowres', 'bad anatomy', 'bad hands', 'text', 'error',
        'missing fingers', 'extra digit', 'fewer digits', 'cropped',
        'worst quality', 'low quality', 'normal quality', 'jpeg artifacts',
        'signature', 'watermark', 'username', 'blurry', 'ugly',
        'duplicate', 'morbid', 'mutilated', 'out of frame', 'extra fingers',
        'mutated hands', 'poorly drawn hands', 'poorly drawn face',
        'mutation', 'deformed', 'bad proportions', 'malformed limbs',
        'extra limbs', 'cloned face', 'disfigured', 'gross proportions',
        'missing arms', 'missing legs', 'extra arms', 'extra legs',
        'fused fingers', 'too many fingers', 'long neck', 'oversaturated',
        'bad composition', 'bad lighting', 'pixelated', 'low detail'
      );
    }

    return negParts.join(', ');
  }

  /**
   * Check if character has usable embeddings
   */
  async checkEmbeddingAvailability(characterId: string): Promise<{
    hasEmbeddings: boolean;
    status: string;
    totalImages: number;
    message: string;
  }> {
    try {
      const character = await CharacterModel.findOne({ id: parseInt(characterId) });
      if (!character) {
        return {
          hasEmbeddings: false,
          status: 'character_not_found',
          totalImages: 0,
          message: 'Character not found'
        };
      }

      const embeddingData = character.embeddings?.imageEmbeddings;
      
      if (!embeddingData) {
        return {
          hasEmbeddings: false,
          status: 'no_embeddings',
          totalImages: 0,
          message: 'No embeddings generated for this character'
        };
      }

      return {
        hasEmbeddings: embeddingData.status === 'completed' && embeddingData.totalImages >= 5,
        status: embeddingData.status || 'unknown',
        totalImages: embeddingData.totalImages || 0,
        message: embeddingData.status === 'completed' 
          ? `${embeddingData.totalImages} embedding images available`
          : `Embedding status: ${embeddingData.status}`
      };

    } catch (error) {
      return {
        hasEmbeddings: false,
        status: 'error',
        totalImages: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all generated images for a specific character and user
   * This looks in the user's premade_characters folder for images they generated
   */
  async getCharacterImages(userId: string, characterId: string): Promise<{
    success: boolean;
    images: Array<{
      url: string;
      publicId: string;
      createdAt: string;
      filename: string;
    }>;
    totalCount: number;
    error?: string;
  }> {
    try {
      console.log(`📸 Getting all images for character ID: ${characterId}, user: ${userId}`);

      // Get character data
      const character = await CharacterModel.findOne({ id: parseInt(characterId) });
      if (!character) {
        throw new Error('Character not found');
      }

      // Get user information to use username for folder path
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      const username = user.username;

      // Note: Images can be stored in two places:
      // 1. For characters created by the user: ${username}/characters/${characterName}/images
      // 2. For existing characters they generate images for: ${username}/premade_characters/${characterName}/images
      
      const sanitizedCharacterName = character.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Check if the user is the creator of this character
      const isCreator = character.creatorId && character.creatorId.toString() === userId;
      const folderPath = isCreator 
        ? `${username}/characters/${sanitizedCharacterName}/images`
        : `${username}/premade_characters/${sanitizedCharacterName}/images`;
      
      console.log(`🔍 Searching Bunny CDN folder: ${folderPath} (isCreator: ${isCreator})`);

      // Search for images with the ComfyUI naming pattern: username_charactername_image_*
      const searchPattern = `${username}_${sanitizedCharacterName}_image_*`;
      console.log(`🔍 Search pattern: ${searchPattern}`);
      
      // Get list of files from Bunny CDN
      const listResult = await BunnyStorageService.listFiles(folderPath);
      
      if (!listResult.success) {
        console.log(`� No images found in Bunny CDN folder: ${folderPath}`);
        return {
          success: true,
          images: [],
          totalCount: 0
        };
      }

      // Filter files that match our pattern and sort by name (which includes sequence numbers)
      const imageFiles = (listResult.files || [])
        .filter(filename => {
          const matches = filename.includes(`${username}_${sanitizedCharacterName}_image_`) && filename.endsWith('.png');
          console.log(`🔍 Checking file: ${filename}, matches pattern: ${matches}`);
          return matches;
        })
        .sort((a, b) => {
          // Extract sequence numbers and sort in descending order (newest first)
          const aMatch = a.match(/_image_(\d+)\.png$/);
          const bMatch = b.match(/_image_(\d+)\.png$/);
          if (aMatch && bMatch) {
            return parseInt(bMatch[1]) - parseInt(aMatch[1]);
          }
          return b.localeCompare(a);
        });

      console.log(`📊 Found ${imageFiles.length} matching image files`);

      // Convert to the expected format
      const images = imageFiles.map(filename => ({
        url: BunnyStorageService.getPublicUrl(`${folderPath}/${filename}`),
        publicId: `${folderPath}/${filename}`,
        createdAt: new Date().toISOString(), // We don't have creation date from Bunny CDN list
        filename: filename
      }));

      return {
        success: true,
        images: images,
        totalCount: images.length
      };

    } catch (error) {
      console.error(`❌ Error getting character images from Bunny CDN:`, error);
      return {
        success: false,
        images: [],
        totalCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}