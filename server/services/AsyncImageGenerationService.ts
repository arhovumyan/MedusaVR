import { EventEmitter } from 'events';
import { EmbeddingBasedImageGenerationService } from './EmbeddingBasedImageGenerationService.js';
import { PlaceholderImageService } from './PlaceholderImageService.js';
import { UserModel } from '../db/models/UserModel.js';
import { BunnyFolderService } from './BunnyFolderService.js';
import fetch from 'node-fetch';
import runPodService from './RunPodService.js';

export interface GenerationJob {
  id: string;
  userId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  request: GenerationJobRequest;
  result?: GenerationJobResult;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number; // in seconds
}

export interface GenerationJobRequest {
  prompt: string;
  negativePrompt?: string;
  characterId?: string;
  characterName?: string;
  characterPersona?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  quantity?: number;
  artStyle?: string;
  model?: string;
  loras?: Array<{ name: string; strength: number }>;
  // New LoRA fields for ComfyUI workflows when generating with embeddings
  loraModel?: string; // filename, e.g. "exploding_clothes.safetensors"
  loraStrength?: number; // 0.1-1.5 (we clamp in the downstream service)
  nsfw?: boolean;
}

export interface GenerationJobResult {
  imageId: string;
  imageUrl: string;
  imageUrls: string[];
  generatedCount: number;
  usedEmbedding: boolean;
  seed?: number;
  generationTime: number; // in seconds
}

class AsyncImageGenerationService extends EventEmitter {
  private jobs: Map<string, GenerationJob> = new Map();
  private embeddingService: EmbeddingBasedImageGenerationService;
  private processingQueue: string[] = [];
  private isProcessing = false;
  private maxConcurrentJobs = 3; // Adjust based on server capacity

  constructor() {
    super();
    this.embeddingService = new EmbeddingBasedImageGenerationService();
    this.startQueueProcessor();
  }

  /**
   * Start a new image generation job
   */
  async startGeneration(userId: string, request: GenerationJobRequest): Promise<string> {
    const jobId = this.generateJobId();
    
    const job: GenerationJob = {
      id: jobId,
      userId,
      status: 'queued',
      progress: 0,
      request,
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);
    this.processingQueue.push(jobId);

    console.log(`🚀 Started async generation job ${jobId} for user ${userId}`);
    console.log(`📋 Queue position: ${this.processingQueue.length}, Queue size: ${this.processingQueue.length}`);

    // Emit job created event
    this.emit('jobCreated', job);

    // Start processing if not already running
    this.processQueue();

    return jobId;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): GenerationJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get all jobs for a user
   */
  getUserJobs(userId: string): GenerationJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string, userId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.userId !== userId) {
      return false;
    }

    if (job.status === 'queued') {
      // Remove from queue
      const queueIndex = this.processingQueue.indexOf(jobId);
      if (queueIndex > -1) {
        this.processingQueue.splice(queueIndex, 1);
      }
      
      job.status = 'failed';
      job.error = 'Cancelled by user';
      job.completedAt = new Date();
      
      this.emit('jobUpdated', job);
      return true;
    }

    return false; // Cannot cancel processing or completed jobs
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor() {
    setInterval(() => {
      this.processQueue();
    }, 1000); // Check queue every second
  }

  /**
   * Process the queue
   */
  private async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    // Get currently processing jobs
    const processingJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'processing').length;

    if (processingJobs >= this.maxConcurrentJobs) {
      return; // Max concurrent jobs reached
    }

    const jobId = this.processingQueue.shift();
    if (!jobId) return;

    const job = this.jobs.get(jobId);
    if (!job) return;

    this.processJob(job);
  }

  /**
   * Process a single job
   */
  private async processJob(job: GenerationJob) {
    try {
      console.log(`🎨 Starting generation for job ${job.id}`);
      
      // Update job status
      job.status = 'processing';
      job.startedAt = new Date();
      job.progress = 10;
      job.estimatedTimeRemaining = 20; // Estimated 20 seconds
      this.emit('jobUpdated', job);

      const { request } = job;
      let imageResult;

      // Progress update: Starting generation
      job.progress = 20;
      this.emit('jobUpdated', job);

      // If characterId is provided, use embedding-based generation
      if (request.characterId) {
        console.log(`🎭 Using embedding-based generation for character: ${request.characterId}`);
        
        job.progress = 30;
        job.estimatedTimeRemaining = 15;
        this.emit('jobUpdated', job);

        imageResult = await this.embeddingService.generateImageWithEmbedding({
          characterId: request.characterId,
          prompt: request.prompt,
          negativePrompt: request.negativePrompt,
          width: request.width,
          height: request.height,
          steps: request.steps,
          cfgScale: request.cfgScale,
          seed: request.seed,
          quantity: request.quantity,
          currentUserId: job.userId, // Pass the current user ID
          immediateResponse: (request as any).immediateResponse || false, // Add immediate response option
          // Add LoRA support
          loraModel: request.loraModel,
          loraStrength: request.loraStrength
        });

        job.progress = 70;
        job.estimatedTimeRemaining = 5;
        this.emit('jobUpdated', job);

        if (!imageResult.success) {
          console.log(`⚠️ Embedding generation failed, falling back to standard generation: ${imageResult.error}`);
          
          job.progress = 40;
          job.estimatedTimeRemaining = 10;
          this.emit('jobUpdated', job);

          // Fallback to standard generation with multiple images support
          imageResult = await this.generateMultipleImagesWithRunPod(request, job.userId, request.quantity || 1);

          job.progress = 80;
          job.estimatedTimeRemaining = 3;
          this.emit('jobUpdated', job);
        }
      } else {
        // No character specified, use txt2img with multiple images support
        console.log('🎨 No character specified, using txt2img');
        
        job.progress = 40;
        job.estimatedTimeRemaining = 10;
        this.emit('jobUpdated', job);

        imageResult = await this.generateMultipleImagesWithRunPod(request, job.userId, request.quantity || 1);

        job.progress = 80;
        job.estimatedTimeRemaining = 3;
        this.emit('jobUpdated', job);
      }

      if (!imageResult.success) {
        // Create placeholders as fallback
        console.log(`⚠️ All generation methods failed, creating ${request.quantity || 1} placeholder(s): ${imageResult.error}`);
        
        job.progress = 50;
        this.emit('jobUpdated', job);

        let placeholderResult;
        if ((request.quantity || 1) > 1) {
          placeholderResult = await PlaceholderImageService.createBatchPlaceholders({
            characterId: request.characterId,
            characterName: request.characterName,
            prompt: request.prompt,
            userId: job.userId,
            width: request.width || 1024,
            height: request.height || 1536,
            quantity: request.quantity || 1,
            currentUserId: job.userId // Pass the current user ID for proper folder structure
          });
        } else {
          placeholderResult = await PlaceholderImageService.createTextPlaceholder({
            characterId: request.characterId,
            characterName: request.characterName,
            prompt: request.prompt,
            userId: job.userId,
            width: request.width || 1024,
            height: request.height || 1536,
            currentUserId: job.userId // Pass the current user ID for proper folder structure
          });
        }

        if (placeholderResult.success) {
          imageResult = {
            success: true,
            imageUrl: placeholderResult.imageUrl!,
            imageUrls: placeholderResult.imageUrls || [placeholderResult.imageUrl!],
            imageId: placeholderResult.imageId!,
            generationTime: 1,
            usedEmbedding: false,
            generatedCount: placeholderResult.generatedCount || 1,
            status: 'placeholder_created'
          };
        }
      }

      job.progress = 90;
      job.estimatedTimeRemaining = 1;
      this.emit('jobUpdated', job);

      if (imageResult.success) {
        // Job completed successfully
        job.status = 'completed';
        job.progress = 100;
        job.estimatedTimeRemaining = 0;
        job.completedAt = new Date();
        job.result = {
          imageId: imageResult.imageId || `img_${Date.now()}`,
          imageUrl: imageResult.imageUrl,
          imageUrls: imageResult.imageUrls || [imageResult.imageUrl],
          generatedCount: imageResult.generatedCount || 1,
          usedEmbedding: imageResult.usedEmbedding || false,
          seed: imageResult.seed,
          generationTime: imageResult.generationTime || 0
        };

        console.log(`✅ Job ${job.id} completed successfully`);
        console.log(`🎯 Emitting jobCompleted event for job ${job.id} with characterId: ${job.request.characterId}`);
        this.emit('jobCompleted', job);
      } else {
        throw new Error(imageResult.error || 'Generation failed');
      }

    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      job.progress = 0;
      job.estimatedTimeRemaining = 0;
      
      this.emit('jobFailed', job);
    }

    this.emit('jobUpdated', job);
  }

  /**
   * Generate multiple images using RunPod service and upload to Cloudinary
   */
  private async generateMultipleImagesWithRunPod(request: GenerationJobRequest, userId: string, quantity: number): Promise<any> {
    console.log(`🎨 Generating ${quantity} images with RunPod service`);

    try {
      // Get user information for Cloudinary upload
      const user = await UserModel.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const username = user.username;
      // Fix: Use proper folder structure for images without character context
      const characterName = request.characterName || 'general';

      if (quantity === 1) {
        // Single image - use existing method and upload to Cloudinary
        // Build LoRA array if individual LoRA is specified
        let lorasArray = request.loras || [];
        if (request.loraModel && request.loraStrength) {
          lorasArray = [{
            name: request.loraModel,
            strength: request.loraStrength
          }];
        }

        const result = await runPodService.generateImage({
          prompt: request.prompt,
          negativePrompt: request.negativePrompt,
          width: request.width,
          height: request.height,
          steps: request.steps,
          cfgScale: request.cfgScale,
          seed: request.seed,
          model: request.model || runPodService.getRecommendedModel(request.artStyle || 'anime'),
          artStyle: request.artStyle || 'anime',
          characterData: { 
            characterId: request.characterId, 
            characterName: request.characterName, 
            characterPersona: request.characterPersona 
          },
          loras: lorasArray
        });

        if (result.success && result.imageUrl) {
          // Download and upload to Cloudinary
          console.log(`🔄 Uploading single image to Cloudinary...`);
          const uploadedUrl = await this.uploadImageToCloudinary(
            result.imageUrl, 
            username, 
            characterName, 
            1,
            request.characterId ? userId : undefined, // Pass userId only if we have a characterId
            request.characterId
          );
          if (uploadedUrl) {
            console.log(`✅ Single image uploaded successfully: ${uploadedUrl}`);
            result.imageUrl = uploadedUrl;
            // Add imageUrls property for consistency
            (result as any).imageUrls = [uploadedUrl];
          } else {
            console.error(`❌ Failed to upload single image to Cloudinary`);
            // Still return the original URL as fallback
            console.log(`⚠️ Using original RunPod URL as fallback: ${result.imageUrl}`);
          }
        }

        // Perform cleanup after single image generation
        try {
          console.log('🧹 Performing RunPod cleanup after single image generation...');
          await runPodService.performCleanup(request.artStyle);
        } catch (cleanupError) {
          console.warn('⚠️ Cleanup failed, but continuing with result:', cleanupError);
        }

        return result;
      }

      // Multiple images - generate concurrently
      // Build LoRA array if individual LoRA is specified
      let lorasArray = request.loras || [];
      if (request.loraModel && request.loraStrength) {
        lorasArray = [{
          name: request.loraModel,
          strength: request.loraStrength
        }];
      }

      const imagePromises: Promise<any>[] = [];
      
      for (let i = 0; i < quantity; i++) {
        const imagePromise = runPodService.generateImage({
          prompt: request.prompt,
          negativePrompt: request.negativePrompt,
          width: request.width,
          height: request.height,
          steps: request.steps,
          cfgScale: request.cfgScale,
          seed: request.seed ? request.seed + i : undefined, // Vary seed for different images
          model: request.model || runPodService.getRecommendedModel(request.artStyle || 'anime'),
          artStyle: request.artStyle || 'anime',
          characterData: { 
            characterId: request.characterId, 
            characterName: request.characterName, 
            characterPersona: request.characterPersona 
          },
          loras: lorasArray
        });
        imagePromises.push(imagePromise);
      }

      console.log(`🚀 Starting generation of ${quantity} images...`);
      const imageResults = await Promise.allSettled(imagePromises);
      
      // Process results and upload to Bunny CDN with improved sequential processing
      const successfulImages: string[] = [];
      const errors: string[] = [];
      let firstSeed: number | undefined;
      
      console.log(`📤 Starting sequential upload of ${imageResults.length} images to prevent CDN overload...`);
      
      for (let index = 0; index < imageResults.length; index++) {
        const result = imageResults[index];
        
        if (result.status === 'fulfilled' && result.value.success && result.value.imageUrl) {
          try {
            // Upload to Bunny CDN with proper naming
            console.log(`🔄 Processing image ${index + 1}/${quantity}...`);
            const uploadedUrl = await this.uploadImageToCloudinaryWithRetry(
              result.value.imageUrl, 
              username, 
              characterName, 
              index + 1,
              request.characterId ? userId : undefined, // Pass userId only if we have a characterId
              request.characterId,
              3 // max retries
            );
            
            if (uploadedUrl) {
              successfulImages.push(uploadedUrl);
              if (index === 0) {
                firstSeed = result.value.seed;
              }
              console.log(`✅ Image ${index + 1}/${quantity} generated and uploaded successfully`);
            } else {
              // Even if Bunny CDN upload fails, we can still use the original RunPod URL
              console.warn(`⚠️ Bunny CDN upload failed for image ${index + 1}, using RunPod URL as fallback`);
              successfulImages.push(result.value.imageUrl);
              if (index === 0) {
                firstSeed = result.value.seed;
              }
              errors.push(`Image ${index + 1}: Bunny CDN upload failed, using fallback URL`);
            }
            
            // Add small delay between uploads to avoid overwhelming Bunny CDN
            if (index < imageResults.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
          } catch (uploadError) {
            console.error(`❌ Image ${index + 1}/${quantity} upload error:`, uploadError);
            // Use original URL as fallback
            successfulImages.push(result.value.imageUrl);
            if (index === 0) {
              firstSeed = result.value.seed;
            }
            errors.push(`Image ${index + 1}: Upload error - ${uploadError}, using fallback URL`);
          }
        } else {
          const error = result.status === 'rejected' ? result.reason : result.value.error;
          errors.push(`Image ${index + 1}: Generation failed - ${error}`);
          console.error(`❌ Image ${index + 1}/${quantity} generation failed:`, error);
        }
      }

      console.log(`🎉 RunPod batch generation completed! Success: ${successfulImages.length}/${quantity}`);

      // Perform cleanup after batch generation to prevent state pollution
      try {
        console.log('🧹 Performing RunPod cleanup after batch generation...');
        await runPodService.performCleanup(request.artStyle);
      } catch (cleanupError) {
        console.warn('⚠️ Cleanup failed, but continuing with results:', cleanupError);
      }

      if (successfulImages.length === 0) {
        return {
          success: false,
          error: `All image generations failed: ${errors.join(', ')}`,
          generatedCount: 0
        };
      }

      return {
        success: true,
        imageUrls: successfulImages,
        imageUrl: successfulImages[0], // First image for backward compatibility
        generatedCount: successfulImages.length,
        seed: firstSeed,
        usedEmbedding: false
      };

    } catch (error) {
      console.error(`❌ RunPod batch generation failed:`, error);
      
      // Perform cleanup even on failure to prevent state pollution
      try {
        console.log('🧹 Performing RunPod cleanup after generation failure...');
        await runPodService.performCleanup(request.artStyle);
      } catch (cleanupError) {
        console.warn('⚠️ Cleanup failed after generation error:', cleanupError);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        generatedCount: 0
      };
    }
  }

  /**
   * Upload image to Bunny CDN with retry logic for improved reliability
   */
  private async uploadImageToCloudinaryWithRetry(
    imageUrl: string, 
    username: string, 
    characterName: string, 
    imageIndex: number,
    userId?: string,
    characterId?: string,
    maxRetries: number = 3
  ): Promise<string | null> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Upload attempt ${attempt}/${maxRetries} for image ${imageIndex}`);
        const result = await this.uploadImageToCloudinary(
          imageUrl,
          username,
          characterName,
          imageIndex,
          userId,
          characterId
        );
        
        if (result) {
          console.log(`✅ Upload successful on attempt ${attempt}/${maxRetries} for image ${imageIndex}`);
          return result;
        } else {
          throw new Error('Upload returned null');
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown upload error');
        console.warn(`⚠️ Upload attempt ${attempt}/${maxRetries} failed for image ${imageIndex}:`, lastError.message);
        
        // If this isn't the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          console.log(`⏳ Waiting ${delay}ms before retry ${attempt + 1}/${maxRetries} for image ${imageIndex}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error(`❌ All ${maxRetries} upload attempts failed for image ${imageIndex}:`, lastError!.message);
    return null;
  }

  /**
   * Upload image to Bunny CDN with proper naming convention and indexing
   */
  private async uploadImageToCloudinary(
    imageUrl: string, 
    username: string, 
    characterName: string, 
    imageIndex: number,
    userId?: string,
    characterId?: string
  ): Promise<string | null> {
    try {
      console.log(`📤 Starting upload for image ${imageIndex}: ${imageUrl.substring(0, 100)}...`);
      console.log(`📁 Target folder: ${username}/${userId && characterId ? 'premade_characters' : 'characters'}/${characterName}/images`);
      console.log(`📊 Context: userId=${userId ? 'provided' : 'none'}, characterId=${characterId ? 'provided' : 'none'}`);
      
      let imageBuffer: Buffer;
      
      // Check if it's a base64 data URL (from RunPod)
      if (imageUrl.startsWith('data:image/')) {
        console.log(`🔄 Processing base64 data URL for image ${imageIndex}`);
        // Extract base64 data from data URL
        const base64Data = imageUrl.split(',')[1];
        if (!base64Data) {
          throw new Error('Invalid base64 data URL format');
        }
        imageBuffer = Buffer.from(base64Data, 'base64');
        console.log(`✅ Decoded base64 image ${imageIndex}, size: ${(imageBuffer.length / 1024).toFixed(1)}KB`);
      } else {
        // It's a regular URL, download it
        console.log(`🔄 Downloading image from URL for image ${imageIndex}`);
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
        }
        
        imageBuffer = Buffer.from(await response.arrayBuffer());
        console.log(`✅ Downloaded image ${imageIndex}, size: ${(imageBuffer.length / 1024).toFixed(1)}KB`);
      }
      
      let uploadResult;
      
      if (userId && characterId) {
        // User generating image from existing character - use premade_characters folder with indexing
        console.log(`📂 Using indexed upload for premade character: ${username}/premade_characters/${characterName}/images`);
        
        uploadResult = await BunnyFolderService.uploadPremadeCharacterImageWithIndexing(
          username,
          characterName,
          imageBuffer
        );
        
        if (uploadResult.success) {
          console.log(`✅ Successfully uploaded indexed image: ${uploadResult.fileName} (image #${uploadResult.imageNumber})`);
        } else {
          console.error(`❌ Failed to upload indexed image:`, uploadResult.error);
          throw new Error(`Bunny CDN indexed upload failed: ${uploadResult.error}`);
        }
      } else {
        // Character creation or general image - use standard character folder with old naming
        const sanitizedCharacterName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const paddedIndex = imageIndex.toString().padStart(4, '0');
        const filename = `${username}_${sanitizedCharacterName}_image_${paddedIndex}.png`;
        
        console.log(`📂 Uploading to character creator folder: ${username}/characters/${sanitizedCharacterName}/images`);
        uploadResult = await BunnyFolderService.uploadToCharacterFolder(
          username,
          sanitizedCharacterName,
          imageBuffer,
          filename,
          'images'
        );
        
        if (uploadResult.success) {
          console.log(`✅ Successfully uploaded image ${imageIndex} to character creator folder: ${uploadResult.url}`);
        } else {
          console.error(`❌ Failed to upload image ${imageIndex} to character creator folder:`, uploadResult.error);
          throw new Error(`Bunny CDN upload to character creator folder failed: ${uploadResult.error}`);
        }
      }

      console.log(`🎉 Image ${imageIndex} upload completed successfully: ${uploadResult.url}`);
      return uploadResult.url!;

    } catch (error) {
      console.error(`❌ Complete failure uploading image ${imageIndex}:`, error);
      console.error(`   Image URL: ${imageUrl.substring(0, 150)}...`);
      console.error(`   Target: ${username}/${userId && characterId ? 'premade_characters' : 'characters'}/${characterName}/images`);
      console.error(`   Error details:`, {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined
      });
      
      // Return null to allow the process to continue but log the failure
      return null;
    }
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old completed jobs (call periodically)
   */
  cleanupOldJobs(maxAgeHours: number = 24) {
    const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
    let cleanedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.completedAt && job.completedAt < cutoffTime) {
        this.jobs.delete(jobId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old jobs`);
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      queued: jobs.filter(j => j.status === 'queued').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      queueLength: this.processingQueue.length
    };
  }
}

// Export singleton instance
export const asyncImageGenerationService = new AsyncImageGenerationService();
export default asyncImageGenerationService;
