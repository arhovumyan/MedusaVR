import 'dotenv/config';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { BunnyFolderService } from './BunnyFolderService.js';
import { BunnyStorageService } from './BunnyStorageService.js';
import fetch from 'node-fetch';
import FormData from 'form-data';
import crypto from 'crypto';

export interface TextualInversionTrainingOptions {
  characterId: string;
  characterName: string;
  username: string;
  embeddingImages: string[]; // Array of Bunny CDN URLs
  learningRate?: number;
  steps?: number;
  batchSize?: number;
}

export interface TextualInversionResult {
  success: boolean;
  embeddingName?: string;
  embeddingUrl?: string;
  safetensorsUrl?: string;
  trainedTokens?: number;
  trainingTime?: number;
  error?: string;
}

export class TextualInversionService {
  private runpodUrl: string;

  constructor() {
    this.runpodUrl = process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL || 
                     process.env.RUNPOD_WEBUI_URL || 
                     'https://4mm1jblh0l3mv2-7861.proxy.runpod.net';
    
    // Remove trailing slash if present
    this.runpodUrl = this.runpodUrl.replace(/\/$/, '');
  }

  /**
   * Train a textual inversion embedding from character images
   * This creates a token that can be used in prompts to reference the character
   */
  async trainTextualInversionEmbedding(options: TextualInversionTrainingOptions): Promise<TextualInversionResult> {
    try {
      console.log(`🧠 Training textual inversion embedding for character: ${options.characterName}`);
      console.log(`📚 Using ${options.embeddingImages.length} training images`);

      // Create unique embedding name
      const embeddingName = this.generateEmbeddingName(options.characterName);
      console.log(`🏷️ Embedding name: ${embeddingName}`);

      // Check if embedding already exists
      const existingEmbedding = await this.checkExistingEmbedding(options.username, options.characterName);
      if (existingEmbedding) {
        console.log(`✅ Embedding already exists: ${existingEmbedding}`);
        return {
          success: true,
          embeddingName,
          embeddingUrl: existingEmbedding,
          safetensorsUrl: existingEmbedding
        };
      }

      // Step 1: Download images from BunnyCDN to ComfyUI server
      console.log(`📥 Downloading ${options.embeddingImages.length} images for training...`);
      const downloadedImages = await this.downloadImagesToComfyUI(options.embeddingImages, embeddingName);
      
      if (downloadedImages.length === 0) {
        throw new Error('No images were successfully downloaded for training');
      }

      console.log(`✅ Downloaded ${downloadedImages.length} images successfully`);

      // Step 2: Create textual inversion training workflow
      const trainingWorkflow = this.createTextualInversionWorkflow({
        embeddingName,
        imageCount: downloadedImages.length,
        learningRate: options.learningRate || 0.005,
        steps: options.steps || 1000,
        batchSize: options.batchSize || 1
      });

      console.log(`🚀 Starting textual inversion training...`);
      const startTime = Date.now();

      // Step 3: Submit training workflow to ComfyUI
      const trainingResponse = await fetch(`${this.runpodUrl}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingWorkflow)
      });

      if (!trainingResponse.ok) {
        throw new Error(`Training request failed: ${trainingResponse.status}`);
      }

      const trainingResult = await trainingResponse.json() as any;
      const promptId = trainingResult.prompt_id;

      if (!promptId) {
        throw new Error('No prompt_id received for training');
      }

      console.log(`✅ Training started with prompt ID: ${promptId}`);

      // Step 4: Wait for training completion (can take 10-30 minutes)
      console.log(`⏳ Training in progress... This can take 10-30 minutes`);
      await this.waitForTrainingCompletion(promptId, options.steps || 1000);

      const trainingTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ Training completed in ${trainingTime} seconds`);

      // Step 5: Download the trained embedding file
      const embeddingFilePath = `embeddings/${embeddingName}.safetensors`;
      const embeddingBuffer = await this.downloadTrainedEmbedding(embeddingFilePath);

      if (!embeddingBuffer || embeddingBuffer.length === 0) {
        throw new Error('Failed to download trained embedding file');
      }

      console.log(`📁 Downloaded embedding file: ${(embeddingBuffer.length / 1024).toFixed(1)}KB`);

      // Step 6: Upload embedding to BunnyCDN
      const embeddingFileName = `${embeddingName}.safetensors`;
      const uploadResult = await BunnyFolderService.uploadToCharacterFolder(
        options.username,
        options.characterName,
        embeddingBuffer,
        embeddingFileName,
        'embeddings'
      );

      if (!uploadResult.success) {
        throw new Error(`Failed to upload embedding to BunnyCDN: ${uploadResult.error}`);
      }

      console.log(`☁️ Embedding uploaded to BunnyCDN: ${uploadResult.url}`);

      // Step 7: Update character record with embedding info
      await this.updateCharacterWithEmbedding(options.characterId, {
        embeddingName,
        embeddingUrl: uploadResult.url!,
        safetensorsUrl: uploadResult.url!,
        trainedAt: new Date(),
        trainingSteps: options.steps || 1000,
        trainingImages: options.embeddingImages.length
      });

      return {
        success: true,
        embeddingName,
        embeddingUrl: uploadResult.url!,
        safetensorsUrl: uploadResult.url!,
        trainedTokens: 1,
        trainingTime
      };

    } catch (error) {
      console.error(`❌ Textual inversion training failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown training error'
      };
    }
  }

  /**
   * Generate a unique embedding name for the character
   */
  private generateEmbeddingName(characterName: string): string {
    // Create a consistent, unique name
    const sanitized = characterName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const hash = crypto.createHash('md5').update(characterName).digest('hex').substring(0, 8);
    return `emb_${sanitized}_${hash}`;
  }

  /**
   * Check if an embedding already exists for this character
   */
  private async checkExistingEmbedding(username: string, characterName: string): Promise<string | null> {
    try {
      const embeddingsFolder = `${username}/characters/${characterName}/embeddings`;
      const listResult = await BunnyStorageService.listFiles(embeddingsFolder);
      
      if (listResult.success && listResult.files) {
        const safetensorsFile = listResult.files.find(file => file.endsWith('.safetensors'));
        if (safetensorsFile) {
          return `https://medusa-vrfriendly.vercel.app/${embeddingsFolder}/${safetensorsFile}`;
        }
      }
      
      return null;
    } catch (error) {
      console.warn(`⚠️ Error checking existing embedding:`, error);
      return null;
    }
  }

  /**
   * Download images from BunnyCDN to ComfyUI server for training
   */
  private async downloadImagesToComfyUI(imageUrls: string[], embeddingName: string): Promise<string[]> {
    const downloadedImages: string[] = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const imageUrl = imageUrls[i];
        console.log(`📥 Downloading training image ${i + 1}/${imageUrls.length}`);
        
        // Download image from BunnyCDN
        const response = await fetch(imageUrl);
        if (!response.ok) {
          console.warn(`⚠️ Failed to download ${imageUrl}: ${response.status}`);
          continue;
        }
        
        const imageBuffer = Buffer.from(await response.arrayBuffer());
        if (imageBuffer.length === 0) {
          console.warn(`⚠️ Empty image downloaded: ${imageUrl}`);
          continue;
        }
        
        // Upload image to ComfyUI input folder
        const imageName = `${embeddingName}_${i.toString().padStart(3, '0')}.png`;
        const uploadSuccess = await this.uploadImageToComfyUI(imageBuffer, imageName);
        
        if (uploadSuccess) {
          downloadedImages.push(imageName);
          console.log(`✅ Prepared training image: ${imageName}`);
        }
        
      } catch (error) {
        console.warn(`⚠️ Error preparing training image ${i + 1}:`, error);
        continue;
      }
    }
    
    return downloadedImages;
  }

  /**
   * Upload an image to ComfyUI server for training
   */
  private async uploadImageToComfyUI(imageBuffer: Buffer, imageName: string): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename: imageName,
        contentType: 'image/jpeg'
      });
      
      const response = await fetch(`${this.runpodUrl}/upload/image`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });
      
      return response.ok;
    } catch (error) {
      console.warn(`⚠️ Failed to upload image to ComfyUI:`, error);
      return false;
    }
  }

  /**
   * Create ComfyUI workflow for textual inversion training
   */
  private createTextualInversionWorkflow(options: {
    embeddingName: string;
    imageCount: number;
    learningRate: number;
    steps: number;
    batchSize: number;
  }): any {
    return {
      "prompt": {
        "1": {
          "class_type": "TextualInversionTraining",
          "inputs": {
            "embedding_name": options.embeddingName,
            "learning_rate": options.learningRate,
            "batch_size": options.batchSize,
            "gradient_accumulation_steps": 1,
            "max_train_steps": options.steps,
            "save_steps": Math.floor(options.steps / 4), // Save checkpoints
            "resolution": 768,
            "train_text_encoder": false,
            "placeholder_token": `<${options.embeddingName}>`,
            "initializer_token": "person", // Generic token to start with
            "learnable_property": "object"
          }
        },
        "2": {
          "class_type": "SaveEmbedding",
          "inputs": {
            "embedding": ["1", 0],
            "filename_prefix": options.embeddingName
          }
        }
      }
    };
  }

  /**
   * Wait for textual inversion training to complete
   */
  private async waitForTrainingCompletion(promptId: string, expectedSteps: number): Promise<void> {
    const maxWaitTime = 45 * 60 * 1000; // 45 minutes max
    const pollInterval = 30000; // Poll every 30 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(`${this.runpodUrl}/prompt/${promptId}`);
        if (response.ok) {
          const result = await response.json() as any;
          
          if (result.status === 'completed') {
            console.log(`✅ Training completed successfully`);
            return;
          } else if (result.status === 'failed') {
            throw new Error(`Training failed: ${result.error || 'Unknown error'}`);
          } else {
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            console.log(`⏳ Training in progress... (${elapsed}s elapsed)`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.warn(`⚠️ Error checking training status:`, error);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    throw new Error('Training timed out after 45 minutes');
  }

  /**
   * Download the trained embedding file from ComfyUI server
   */
  private async downloadTrainedEmbedding(embeddingPath: string): Promise<Buffer | null> {
    try {
      const response = await fetch(`${this.runpodUrl}/view?filename=${embeddingPath}`);
      if (!response.ok) {
        console.error(`Failed to download embedding: ${response.status}`);
        return null;
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer.length > 0 ? buffer : null;
    } catch (error) {
      console.error(`Error downloading trained embedding:`, error);
      return null;
    }
  }

  /**
   * Update character record with embedding information
   */
  private async updateCharacterWithEmbedding(characterId: string, embeddingInfo: any): Promise<void> {
    try {
      await CharacterModel.findOneAndUpdate(
        { id: parseInt(characterId) },
        {
          $set: {
            'embeddings.textualInversion': embeddingInfo
          }
        }
      );
      
      console.log(`✅ Updated character ${characterId} with embedding information`);
    } catch (error) {
      console.warn(`⚠️ Failed to update character with embedding info:`, error);
    }
  }

  /**
   * Get embedding information for a character
   */
  async getCharacterEmbedding(characterId: string): Promise<{
    hasEmbedding: boolean;
    embeddingName?: string;
    embeddingUrl?: string;
    safetensorsUrl?: string;
  }> {
    try {
      const character = await CharacterModel.findOne({ id: parseInt(characterId) });
      if (!character || !character.embeddings?.textualInversion) {
        return { hasEmbedding: false };
      }

      const embedding = character.embeddings.textualInversion;
      return {
        hasEmbedding: true,
        embeddingName: embedding.embeddingName,
        embeddingUrl: embedding.embeddingUrl,
        safetensorsUrl: embedding.safetensorsUrl
      };
    } catch (error) {
      console.error(`Error getting character embedding:`, error);
      return { hasEmbedding: false };
    }
  }

  /**
   * Generate embedding automatically for a character after images are created
   */
  async generateEmbeddingBackground(characterId: string): Promise<void> {
    try {
      console.log(`🔄 Starting background embedding generation for character: ${characterId}`);
      
      const character = await CharacterModel.findOne({ id: parseInt(characterId) });
      if (!character) {
        console.error(`Character not found: ${characterId}`);
        return;
      }

      // Check if embedding images exist
      const embeddingData = character.embeddings?.imageEmbeddings;
      if (!embeddingData || !embeddingData.bunnyUrls || embeddingData.bunnyUrls.length < 5) {
        console.log(`⚠️ Not enough embedding images for character ${characterId} (need 5+, have ${embeddingData?.bunnyUrls?.length || 0})`);
        return;
      }

      // Get username
      const user = await import('../db/models/UserModel.js').then(m => m.UserModel.findById(character.creatorId));
      if (!user) {
        console.error(`User not found for character ${characterId}`);
        return;
      }

      // Start training
      const result = await this.trainTextualInversionEmbedding({
        characterId: characterId,
        characterName: character.name,
        username: user.username,
        embeddingImages: embeddingData.bunnyUrls,
        steps: 800, // Reduced for faster training
        learningRate: 0.005
      });

      if (result.success) {
        console.log(`🎉 Background embedding training completed for ${character.name}`);
      } else {
        console.error(`❌ Background embedding training failed for ${character.name}:`, result.error);
      }

    } catch (error) {
      console.error(`Error in background embedding generation:`, error);
    }
  }
}

export default new TextualInversionService();
