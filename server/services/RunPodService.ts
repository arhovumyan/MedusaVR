import fetch from 'node-fetch';
import { ImageModerationService } from './ImageModerationService.js';

export interface RunPodImageRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  model?: string;
  sampler?: string;
  artStyle?: string; // Art style for checkpoint selection (cartoon, realistic, anime, fantasy)
  characterData?: {
    characterId?: string;
    characterName?: string;
    characterPersona?: string;
  };
  loras?: Array<{
    name: string;
    strength: number;
  }>;
  enableHr?: boolean;
  hrUpscaler?: string;
  hrScale?: number;
  denoisingStrength?: number;
  baseImageUrl?: string; // For img2img - base character image
}

export interface RunPodImageResponse {
  success: boolean;
  imageId?: string;
  imageUrl?: string;
  seed?: number;
  status?: string;
  error?: string;
}

class RunPodService {
  private webUIUrl: string | null = null;

  constructor() {
    this.webUIUrl = process.env.RUNPOD_WEBUI_URL || null;
  }

  /**
   * Get the appropriate WebUI URL based on art style
   * anime/cartoon/fantasy → 7861, realistic → 7860
   */
  private getWebUIUrlForStyle(style?: string): string | null {
    console.log(`🔍 Getting WebUI URL for style: "${style}"`);
    console.log(`🔧 Environment variables:`, {
      RUNPOD_ANIME_CARTOON_FANTASY_URL: process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL || 'NOT SET',
      RUNPOD_REALISTIC_URL: process.env.RUNPOD_REALISTIC_URL || 'NOT SET',
      RUNPOD_WEBUI_URL: process.env.RUNPOD_WEBUI_URL || 'NOT SET'
    });

    // If no style provided, use fallback URL
    if (!style) {
      const fallbackUrl = process.env.RUNPOD_WEBUI_URL || null;
      console.log(`⚠️ No style provided, using fallback URL: ${fallbackUrl}`);
      return fallbackUrl;
    }

    // Map art styles to URLs (corrected mapping)
    switch (style.toLowerCase()) {
      case 'realistic':
        const realisticUrl = process.env.RUNPOD_REALISTIC_URL || process.env.RUNPOD_WEBUI_URL || null;
        console.log(`🎨 Using realistic checkpoint: ${realisticUrl}`);
        return realisticUrl;
      
      case 'anime':
      case 'cartoon':
      case 'fantasy':
      default:
        const animeUrl = process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL || process.env.RUNPOD_WEBUI_URL || null;
        console.log(`🎨 Using anime/cartoon/fantasy checkpoint: ${animeUrl}`);
        return animeUrl;
    }
  }

  /**
   * Helper method to construct proper API URLs by avoiding double slashes
   */
  private constructApiUrl(baseUrl: string, endpoint: string): string {
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    return normalizedBaseUrl + normalizedEndpoint;
  }

  /**
   * Check if RunPod is available and configured
   */
  isAvailable(): boolean {
    // Re-read environment variable to pick up dynamic changes
    this.webUIUrl = process.env.RUNPOD_WEBUI_URL || null;
    return !!this.webUIUrl;
  }

  /**
   * Health check - verify RunPod is reachable
   */
  async healthCheck(): Promise<boolean> {
    // Re-read environment variable
    this.webUIUrl = process.env.RUNPOD_WEBUI_URL || null;
    if (!this.webUIUrl) {
      return false;
    }

    try {
      const response = await fetch(this.constructApiUrl(this.webUIUrl, '/queue'), {
        method: 'GET',
        timeout: 10000
      });
      return response.ok;
    } catch (error) {
      console.error('RunPod health check failed:', error);
      return false;
    }
  }

  /**
   * Get current loaded model info
   */
  async getCurrentModel(): Promise<string | null> {
    // Re-read environment variable
    this.webUIUrl = process.env.RUNPOD_WEBUI_URL || null;
    if (!this.webUIUrl) return null;

    try {
      // ComfyUI doesn't have a direct equivalent to options, so we'll return null
      // and rely on the model specified in the workflow
      console.log('ComfyUI model info not available via API - using workflow-specified model');
      return null;
    } catch (error) {
      console.warn('Could not get current model:', error.message);
    }
    return null;
  }

  /**
   * Generate image using RunPod txt2img API with retry logic for 524 errors
   */
  async generateImage(request: RunPodImageRequest, retryCount = 0): Promise<RunPodImageResponse> {
    // Get the appropriate URL based on art style
    const webUIUrl = this.getWebUIUrlForStyle(request.artStyle);
    if (!webUIUrl) {
      return {
        success: false,
        error: 'RunPod WebUI URL not configured. Please set the appropriate environment variables for your art style.'
      };
    }

    try {
      console.log('🎨 RunPod image generation started');
      console.log('🔧 Art style:', request.artStyle);
      console.log('🔧 Selected model:', this.getModelForArtStyle(request.artStyle || 'anime'));

      // Build the payload matching the working curl structure
      const payload: any = {
        prompt: request.prompt || '',
        negative_prompt: ImageModerationService.enhanceNegativePrompt(request.negativePrompt) + ', (worst quality, low quality, normal quality, caucasian, toon), lowres, bad anatomy, bad hands, signature, watermarks, ugly, imperfect eyes, unnatural face, unnatural body, error, 6 fingers, 7 fingers, extra limb, missing limbs, colored skin',
        width: request.width || 1024,
        height: request.height || 1536,
        steps: 30,
        cfg_scale: 8,
        sampler_index: "Euler a",
        enable_hr: true,
        hr_upscaler: "Latent",
        hr_scale: 1.5,
        hr_second_pass_steps: 15,
        denoising_strength: 0.6,
        override_settings: {
          sd_model_checkpoint: this.getModelForArtStyle(request.artStyle || 'anime')
        }
      };

      // Add seed if provided
      if (request.seed) {
        payload.seed = request.seed;
      }

      // Use ComfyUI workflow format instead of Automatic1111 API
      const characterSeed = Math.floor(Math.random() * 9999999999);
      const workflowPrompt: any = {};
      let currentNodeId = 0;

      // Base checkpoint loader
      workflowPrompt[currentNodeId.toString()] = {
        "class_type": "CheckpointLoaderSimple",
        "inputs": { 
          "ckpt_name": payload.override_settings.sd_model_checkpoint 
        }
      };
      
      let modelConnection = [currentNodeId.toString(), 0];
      let clipConnection = [currentNodeId.toString(), 1];
      currentNodeId++;

      // Add LoRA nodes if provided
      if (request.loras && request.loras.length > 0) {
        request.loras.forEach((lora) => {
          workflowPrompt[currentNodeId.toString()] = {
            "class_type": "LoraLoader",
            "inputs": {
              "model": modelConnection,
              "clip": clipConnection,
              "lora_name": lora.name,
              "strength_model": lora.strength,
              "strength_clip": lora.strength
            }
          };
          
          modelConnection = [currentNodeId.toString(), 0];
          clipConnection = [currentNodeId.toString(), 1];
          currentNodeId++;
        });
      }

      // Positive prompt
      const positivePromptNodeId = currentNodeId.toString();
      workflowPrompt[positivePromptNodeId] = {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "clip": clipConnection,
          "text": payload.prompt
        }
      };
      currentNodeId++;

      // Negative prompt
      const negativePromptNodeId = currentNodeId.toString();
      workflowPrompt[negativePromptNodeId] = {
        "class_type": "CLIPTextEncode",
        "inputs": {
          "clip": clipConnection,
          "text": payload.negative_prompt
        }
      };
      currentNodeId++;

      // Empty latent image
      const latentNodeId = currentNodeId.toString();
      workflowPrompt[latentNodeId] = {
        "class_type": "EmptyLatentImage",
        "inputs": { 
          "width": payload.width, 
          "height": payload.height,
          "batch_size": 1 
        }
      };
      currentNodeId++;

      // KSampler
      const ksamplerNodeId = currentNodeId.toString();
      workflowPrompt[ksamplerNodeId] = {
        "class_type": "KSampler",
        "inputs": {
          "model": modelConnection,
          "positive": [positivePromptNodeId, 0],
          "negative": [negativePromptNodeId, 0],
          "latent_image": [latentNodeId, 0],
          "steps": payload.steps,
          "cfg": payload.cfg_scale,
          "sampler_name": "dpmpp_2m",
          "scheduler": "karras",
          "denoise": 1.0,
          "seed": payload.seed || characterSeed
        }
      };
      currentNodeId++;

      // VAE Decode
      const vaeDecodeNodeId = currentNodeId.toString();
      workflowPrompt[vaeDecodeNodeId] = {
        "class_type": "VAEDecode",
        "inputs": { "samples": [ksamplerNodeId, 0], "vae": ["0", 2] }
      };
      currentNodeId++;

      // Save Image
      const saveImageNodeId = currentNodeId.toString();
      workflowPrompt[saveImageNodeId] = {
        "class_type": "SaveImage",
        "inputs": {
          "images": [vaeDecodeNodeId, 0],
          "filename_prefix": `output_${Date.now()}`,
          "increment_index": false
        }
      };

      const workflow = {
        "client_id": `${Date.now()}_${Math.random().toString(36).substring(7)}`,
        "prompt": workflowPrompt
      };

      // Use ComfyUI prompt endpoint
      const apiUrl = this.constructApiUrl(webUIUrl, '/prompt');

      console.log('🎨 Sending request to RunPod:', {
        url: apiUrl,
        prompt: payload.prompt.substring(0, 100) + '...',
        model: payload.override_settings.sd_model_checkpoint,
        dimensions: `${payload.width}x${payload.height}`,
        steps: payload.steps
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
        timeout: 300000 // 5 minutes timeout
      });

      console.log('📡 RunPod response status:', response.status);
      console.log('📡 RunPod response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RunPod API error:', response.status, errorText.substring(0, 500));
        
        // If 405 Method Not Allowed, try alternative endpoints
        if (response.status === 405) {
          console.log('🔄 405 detected, trying alternative endpoints...');
          return await this.tryAlternativeEndpoints(webUIUrl, payload, request, retryCount);
        }
        
        // Handle 524 timeout errors with retry logic
        if (response.status === 524 && retryCount < 2) {
          console.log(`⚠️  524 Timeout detected (attempt ${retryCount + 1}/3). Retrying in 30 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 30000));
          return this.generateImage(request, retryCount + 1);
        }
        
        return {
          success: false,
          error: `RunPod API error: ${response.status} - ${errorText.substring(0, 200)}`
        };
      }

      const data = await response.json();
      
      if (!data.prompt_id) {
        return {
          success: false,
          error: 'No prompt_id received from RunPod API'
        };
      }

      const promptId = data.prompt_id;
      console.log(`✅ Workflow submitted successfully. Prompt ID: ${promptId}`);

      // Poll ComfyUI queue to wait for completion
      console.log(`⏳ Polling ComfyUI queue for prompt ${promptId}...`);
      
      let queueComplete = false;
      let pollAttempts = 0;
      const maxPollAttempts = 60; // 60 attempts * 3 seconds = 3 minutes max wait
      
      // Normalize URL to avoid double slashes
      const normalizedUrl = webUIUrl.endsWith('/') ? webUIUrl.slice(0, -1) : webUIUrl;
      
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
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Download generated image using the filename pattern
      const filenamePrefix = workflow.prompt["6"].inputs.filename_prefix;
      const expectedImageFilename = `${filenamePrefix}_00001_.png`;
      console.log(`🎯 Expected image: ${expectedImageFilename}`);

      const imageUrl = `${normalizedUrl}/view?filename=${expectedImageFilename}`;
      console.log(`⬇️ Downloading from: ${imageUrl}`);

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return {
          success: false,
          error: `Failed to download generated image: ${imageResponse.status}`
        };
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      
      // Validate image
      if (imageBuffer.length === 0) {
        return {
          success: false,
          error: 'Downloaded image is empty'
        };
      }

      // Convert to base64 for data URL
      const base64Image = imageBuffer.toString('base64');
      const imageId = `runpod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const dataUrl = `data:image/png;base64,${base64Image}`;

      console.log('✅ Image generated successfully by RunPod');

      // Perform immediate cleanup after successful generation to prevent state pollution
      // Note: This is done asynchronously to not block the response
      setTimeout(async () => {
        try {
          await this.performCleanup(request.artStyle);
        } catch (cleanupError) {
          console.warn('⚠️ Background cleanup failed:', cleanupError);
        }
      }, 100); // Small delay to ensure response is sent first

      return {
        success: true,
        imageId,
        imageUrl: dataUrl,
        seed: workflow.prompt["4"].inputs.seed,
        status: 'completed'
      };

    } catch (error) {
      console.error('RunPod generation error:', error);
      
      // Perform cleanup even on failure to reset state
      setTimeout(async () => {
        try {
          await this.performCleanup(request.artStyle);
        } catch (cleanupError) {
          console.warn('⚠️ Cleanup after error failed:', cleanupError);
        }
      }, 100);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate image using img2img for character consistency
   * This allows reusing an existing character image for new variations
   */
  async generateImageImg2Img(request: RunPodImageRequest & { 
    initImages?: string[]; // Base64 encoded images (legacy)
    denoisingStrength?: number;
  }): Promise<RunPodImageResponse> {
    console.log('🖼️ Starting img2img generation...');
    
    const webUIUrl = this.getWebUIUrlForStyle(request.artStyle);
    if (!webUIUrl) {
      console.error('❌ No RunPod URL configured for img2img');
      return {
        success: false,
        error: 'RunPod service not configured. Please set RUNPOD_WEBUI_URL environment variable.'
      };
    }

    try {
      console.log('🎨 RunPod img2img generation started');
      console.log('🔧 Art style:', request.artStyle);
      console.log('🔧 Selected model:', this.getModelForArtStyle(request.artStyle || 'anime'));

      let initImages: string[] = [];

      // Handle baseImageUrl (new method) or initImages (legacy)
      if (request.baseImageUrl) {
        console.log('🖼️ Fetching base image from URL:', request.baseImageUrl);
        try {
          const imageResponse = await fetch(request.baseImageUrl);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch base image: ${imageResponse.status}`);
          }
          const arrayBuffer = await imageResponse.arrayBuffer();
          const base64Image = Buffer.from(arrayBuffer).toString('base64');
          initImages = [base64Image];
          console.log('✅ Base image converted to base64');
        } catch (imageError) {
          console.error('❌ Error fetching base image:', imageError);
          return {
            success: false,
            error: `Failed to fetch base image: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`
          };
        }
      } else if (request.initImages) {
        initImages = request.initImages;
      } else {
        return {
          success: false,
          error: 'Either baseImageUrl or initImages must be provided for img2img generation'
        };
      }

      // Build the payload for img2img
      const payload: any = {
        init_images: initImages,
        prompt: request.prompt || '',
        negative_prompt: ImageModerationService.enhanceNegativePrompt(request.negativePrompt) + ', (worst quality, low quality, normal quality), lowres, bad anatomy, bad hands, signature, watermarks, ugly, imperfect eyes, unnatural face, unnatural body, error, extra limb, missing limbs',
        width: request.width || 768,
        height: request.height || 768,
        steps: 25, // Higher quality with 25 steps
        cfg_scale: 8,
        sampler_index: 'Euler a',
        denoising_strength: 0.9, // Set to 0.4 for better quality and variation
        enable_hr: true, // Enable high-res fix for better quality
        hr_upscaler: 'Latent',
        override_settings: {
          sd_model_checkpoint: this.getModelForArtStyle(request.artStyle || 'anime')
        }
      };

      // Add seed if provided for consistency
      if (request.seed) {
        payload.seed = request.seed;
      }

      // Use the helper method to construct API URL
      const apiUrl = this.constructApiUrl(webUIUrl, '/sdapi/v1/img2img');

      console.log('🎨 Sending img2img request to RunPod:', {
        url: apiUrl,
        prompt: payload.prompt.substring(0, 100) + '...',
        model: payload.override_settings.sd_model_checkpoint,
        dimensions: `${payload.width}x${payload.height}`,
        denoisingStrength: payload.denoising_strength
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 RunPod img2img response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RunPod img2img API error:', response.status, errorText.substring(0, 500));
        
        return {
          success: false,
          error: `RunPod img2img API error: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json() as any;

      if (!data.images || !data.images[0]) {
        console.error('❌ No images in RunPod img2img response:', data);
        return {
          success: false,
          error: 'No images generated by RunPod img2img service'
        };
      }

      // The first image is base64 encoded
      const base64Image = data.images[0];
      const imageId = `runpod_img2img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Convert base64 to data URL for immediate use
      const imageUrl = `data:image/png;base64,${base64Image}`;

      console.log('✅ RunPod img2img generation completed successfully');
      console.log(`📊 Generated image ID: ${imageId}`);

      return {
        success: true,
        imageId,
        imageUrl,
        seed: data.seed || request.seed,
        status: 'completed'
      };

    } catch (error) {
      console.error('❌ RunPod img2img generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during img2img generation'
      };
    }
  }
  private async tryAlternativeEndpoints(
    webUIUrl: string, 
    payload: any, 
    request: RunPodImageRequest, 
    retryCount: number
  ): Promise<RunPodImageResponse> {
    // Note: Since we're now using ComfyUI format, we don't need alternative endpoints
    // ComfyUI only uses the /prompt endpoint, so if it fails, it's likely a different issue
    console.log('🔄 ComfyUI format detected - no alternative endpoints needed');
    
    return {
      success: false,
      error: 'ComfyUI /prompt endpoint failed - no alternative endpoints available'
    };
  }

  /**
   * Get available models from RunPod
   */
  async getAvailableModels(): Promise<string[]> {
    // Re-read environment variable
    this.webUIUrl = process.env.RUNPOD_WEBUI_URL || null;
    if (!this.webUIUrl) {
      return ['ILustMix.safetensors']; // Default fallback
    }

    try {
      // ComfyUI doesn't have a models endpoint like Automatic1111
      // Return default models based on art style
      console.log('ComfyUI models endpoint not available - using default models');
      return ['diving.safetensors', 'cyberrealistic.safetensors', 'ILustMix.safetensors'];
    } catch (error) {
      console.warn('Error fetching models from RunPod:', error);
      return ['ILustMix.safetensors']; // Default fallback
    }
  }

  /**
   * Get available samplers from RunPod
   */
  async getAvailableSamplers(): Promise<string[]> {
    // Re-read environment variable
    this.webUIUrl = process.env.RUNPOD_WEBUI_URL || null;
    if (!this.webUIUrl) {
      return ['Euler a', 'Euler', 'DPM++ 2M Karras']; // Default fallback
    }

    try {
      const response = await fetch(this.constructApiUrl(this.webUIUrl, '/sdapi/v1/samplers'), {
        method: 'GET',
        timeout: 10000
      });

      if (!response.ok) {
        console.warn('Could not fetch samplers from RunPod, using defaults');
        return ['Euler a', 'Euler', 'DPM++ 2M Karras'];
      }

      const samplers = await response.json();
      return samplers.map((sampler: any) => sampler.name);
    } catch (error) {
      console.warn('Error fetching samplers from RunPod:', error);
      return ['Euler a', 'Euler', 'DPM++ 2M Karras']; // Default fallback
    }
  }

  /**
   * Get recommended model for a given style
   * Updated to match CharacterGenerationService.getModelForArtStyle()
   */
  getRecommendedModel(style: string): string {
    return this.getModelForArtStyle(style);
  }

  /**
   * Get the appropriate model checkpoint for a given art style
   * Based on user's working curl commands
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
   * Clear GPU memory and reset state on the RunPod instance
   * This should be called after each generation or batch to prevent state pollution
   */
  async clearGPUMemory(artStyle?: string): Promise<boolean> {
    const webUIUrl = this.getWebUIUrlForStyle(artStyle);
    if (!webUIUrl) {
      console.warn('⚠️ Cannot clear GPU memory: WebUI URL not configured');
      return false;
    }

    try {
      console.log('🧹 Clearing GPU memory on RunPod instance...');
      
      // Try to call the memory cleanup endpoint
      const response = await fetch(this.constructApiUrl(webUIUrl, '/sdapi/v1/memory'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
        timeout: 30000 // 30 seconds timeout
      });

      if (response.ok) {
        console.log('✅ GPU memory cleared successfully');
        return true;
      } else {
        console.warn(`⚠️ Memory clear request returned ${response.status}`);
        return false;
      }
    } catch (error) {
      console.warn('⚠️ Failed to clear GPU memory:', error);
      return false;
    }
  }

  /**
   * Unload all models from GPU memory
   */
  async unloadModels(artStyle?: string): Promise<boolean> {
    const webUIUrl = this.getWebUIUrlForStyle(artStyle);
    if (!webUIUrl) {
      console.warn('⚠️ Cannot unload models: WebUI URL not configured');
      return false;
    }

    try {
      console.log('🧹 Unloading models from GPU...');
      
      const response = await fetch(this.constructApiUrl(webUIUrl, '/sdapi/v1/unload-checkpoint'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
        timeout: 30000
      });

      if (response.ok) {
        console.log('✅ Models unloaded successfully');
        return true;
      } else {
        console.warn(`⚠️ Model unload request returned ${response.status}`);
        return false;
      }
    } catch (error) {
      console.warn('⚠️ Failed to unload models:', error);
      return false;
    }
  }

  /**
   * Perform comprehensive cleanup after image generation
   * This combines multiple cleanup strategies for maximum reliability
   */
  async performCleanup(artStyle?: string): Promise<void> {
    console.log('🧹 Starting comprehensive RunPod cleanup...');
    
    try {
      // Try memory cleanup first
      await this.clearGPUMemory(artStyle);
      
      // Wait a moment for memory to clear
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try model unloading as backup
      await this.unloadModels(artStyle);
      
      console.log('✅ RunPod cleanup completed');
    } catch (error) {
      console.warn('⚠️ Cleanup encountered issues:', error);
    }
  }
}

// Export a singleton instance
const runPodService = new RunPodService();
export default runPodService;
export { runPodService };
