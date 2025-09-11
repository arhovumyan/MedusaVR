import runPodService from '../services/RunPodService.js';
import { CloudinaryFolderService } from '../services/CloudinaryFolderService.js';
import { EmbeddingBasedImageGenerationService } from '../services/EmbeddingBasedImageGenerationService.js';
import asyncImageGenerationService from '../services/AsyncImageGenerationService.js';
export class ImageGenerationController {
    constructor() {
        /**
         * Start async image generation and return job ID immediately
         */
        this.generateImage = async (req, res) => {
            try {
                const { prompt, style = 'realistic', artStyle, // New parameter from frontend for character consistency
                width = 1024, height = 1536, characterId, characterName, characterPersona, nsfw = false, model, sampler, steps, cfgScale, seed, quantity = 1, // Default to 1 image
                loras, enableHr, hrUpscaler, hrScale, denoisingStrength, negativePrompt } = req.body;
                // Use artStyle if provided (for character consistency), otherwise fallback to style
                const finalArtStyle = artStyle || style;
                // Validate required fields
                if (!prompt) {
                    res.status(400).json({
                        success: false,
                        error: 'Prompt is required'
                    });
                    return;
                }
                // Get user from auth middleware
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return;
                }
                console.log(`🚀 Starting async image generation for user ${userId} with ${quantity} image(s)`);
                // Start async generation
                const jobId = await asyncImageGenerationService.startGeneration(userId, {
                    prompt,
                    negativePrompt,
                    characterId,
                    characterName,
                    characterPersona,
                    width,
                    height,
                    steps,
                    cfgScale,
                    seed,
                    quantity,
                    artStyle: finalArtStyle,
                    model,
                    loras,
                    nsfw
                });
                // Return job ID immediately
                res.json({
                    success: true,
                    data: {
                        jobId,
                        status: 'started',
                        message: 'Image generation started. Use the job ID to check progress.',
                        estimatedTime: quantity * 15, // Rough estimate: 15 seconds per image
                        pollUrl: `/api/image-generation/jobs/${jobId}`,
                        checkInterval: 2000 // Recommended polling interval in ms
                    }
                });
            }
            catch (error) {
                console.error('Error starting image generation:', error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Internal server error'
                });
            }
        };
        /**
         * Get job status and result
         */
        this.getJobStatus = async (req, res) => {
            try {
                const { jobId } = req.params;
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return;
                }
                const job = asyncImageGenerationService.getJob(jobId);
                if (!job) {
                    res.status(404).json({
                        success: false,
                        error: 'Job not found'
                    });
                    return;
                }
                if (job.userId !== userId) {
                    res.status(403).json({
                        success: false,
                        error: 'Access denied'
                    });
                    return;
                }
                // Return job status
                const response = {
                    success: true,
                    data: {
                        jobId: job.id,
                        status: job.status,
                        progress: job.progress,
                        createdAt: job.createdAt,
                        estimatedTimeRemaining: job.estimatedTimeRemaining
                    }
                };
                if (job.status === 'completed' && job.result) {
                    response.data.result = {
                        imageId: job.result.imageId,
                        imageUrl: job.result.imageUrl,
                        imageUrls: job.result.imageUrls,
                        generatedCount: job.result.generatedCount,
                        usedEmbedding: job.result.usedEmbedding,
                        seed: job.result.seed,
                        generationTime: job.result.generationTime,
                        prompt: job.request.prompt,
                        negativePrompt: job.request.negativePrompt,
                        savedToCloudinary: true
                    };
                }
                if (job.status === 'failed') {
                    response.data.error = job.error;
                }
                res.json(response);
            }
            catch (error) {
                console.error('Error getting job status:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get job status'
                });
            }
        };
        /**
         * Get all jobs for the current user
         */
        this.getUserJobs = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return;
                }
                const jobs = asyncImageGenerationService.getUserJobs(userId);
                res.json({
                    success: true,
                    data: {
                        jobs: jobs.map(job => ({
                            jobId: job.id,
                            status: job.status,
                            progress: job.progress,
                            createdAt: job.createdAt,
                            completedAt: job.completedAt,
                            request: {
                                prompt: job.request.prompt,
                                characterId: job.request.characterId,
                                quantity: job.request.quantity
                            },
                            result: job.result ? {
                                imageUrl: job.result.imageUrl,
                                imageUrls: job.result.imageUrls,
                                generatedCount: job.result.generatedCount
                            } : undefined,
                            error: job.error
                        })),
                        queueStats: asyncImageGenerationService.getQueueStats()
                    }
                });
            }
            catch (error) {
                console.error('Error getting user jobs:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get user jobs'
                });
            }
        };
        /**
         * Cancel a job
         */
        this.cancelJob = async (req, res) => {
            try {
                const { jobId } = req.params;
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return;
                }
                const success = asyncImageGenerationService.cancelJob(jobId, userId);
                if (success) {
                    res.json({
                        success: true,
                        message: 'Job cancelled successfully'
                    });
                }
                else {
                    res.status(400).json({
                        success: false,
                        error: 'Job not found or cannot be cancelled'
                    });
                }
            }
            catch (error) {
                console.error('Error cancelling job:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to cancel job'
                });
            }
        };
        /**
         * Get available image generation models/styles
         */
        this.getModels = async (req, res) => {
            try {
                // Fetch available models from RunPod if available
                const availableModels = await runPodService.getAvailableModels();
                const availableSamplers = await runPodService.getAvailableSamplers();
                const isRunPodAvailable = runPodService.isAvailable();
                res.json({
                    success: true,
                    data: {
                        models: availableModels.map((model) => ({
                            id: model,
                            name: model.replace('.safetensors', '').replace(/([A-Z])/g, ' $1').trim(),
                            description: `AI model: ${model}`
                        })),
                        defaultModel: availableModels[0] || 'ILustMix.safetensors',
                        availableStyles: [
                            { id: 'anime', name: 'Anime', description: 'Anime and manga style characters', model: 'ILustMix.safetensors' },
                            { id: 'realistic', name: 'Realistic', description: 'Photorealistic human portraits', model: 'realisticVisionV51_v51VAE.safetensors' },
                            { id: 'fantasy', name: 'Fantasy', description: 'Fantasy and magical themes', model: 'dreamshaper_8.safetensors' },
                            { id: 'artistic', name: 'Artistic', description: 'Artistic and painterly style', model: 'deliberate_v2.safetensors' },
                            { id: 'cyberpunk', name: 'Cyberpunk', description: 'Futuristic cyberpunk aesthetic', model: 'cyberrealistic_v33.safetensors' },
                        ],
                        availableDimensions: [
                            { width: 512, height: 512, name: 'Square (512x512)' },
                            { width: 768, height: 768, name: 'Square HD (768x768)' },
                            { width: 512, height: 768, name: 'Portrait (512x768)' },
                            { width: 768, height: 512, name: 'Landscape (768x512)' },
                            { width: 1024, height: 1024, name: 'Square Ultra (1024x1024)' }
                        ],
                        availableSamplers: availableSamplers.map((sampler) => ({
                            id: sampler,
                            name: sampler,
                            description: `${sampler} sampling method`
                        })),
                        availableLoras: [
                            { name: 'bra_cups_sticking_out', description: 'Clothing style enhancement', defaultStrength: 0.5 },
                            { name: 'Expressiveh', description: 'Enhanced facial expressions', defaultStrength: 0.7 },
                            { name: 'Unfazed', description: 'Confident character poses', defaultStrength: 0.6 },
                            { name: 'Face_Down', description: 'Specific pose styling', defaultStrength: 0.8 }
                        ],
                        advancedSettings: {
                            steps: { min: 1, max: 100, default: 20, description: 'Number of denoising steps' },
                            cfgScale: { min: 1, max: 30, default: 8, description: 'Classifier Free Guidance scale' },
                            denoisingStrength: { min: 0, max: 1, default: 0.4, step: 0.1, description: 'Strength of denoising for high-resolution enhancement' },
                            hrScale: { min: 1, max: 4, default: 2, step: 0.1, description: 'High-resolution upscaling factor' }
                        },
                        serviceStatus: {
                            runPodAvailable: isRunPodAvailable,
                            status: isRunPodAvailable ? 'connected' : 'offline'
                        }
                    }
                });
            }
            catch (error) {
                console.error('Error fetching models:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch available models'
                });
            }
        };
        /**
         * Health check for RunPod service
         */
        this.healthCheck = async (req, res) => {
            try {
                const isHealthy = await runPodService.healthCheck();
                const isAvailable = runPodService.isAvailable();
                res.json({
                    success: true,
                    data: {
                        runPodAvailable: isAvailable,
                        runPodHealthy: isHealthy,
                        status: isAvailable ? (isHealthy ? 'healthy' : 'configured_but_unreachable') : 'not_configured'
                    }
                });
            }
            catch (error) {
                console.error('Health check error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to perform health check'
                });
            }
        };
        /**
         * Get user's generated images (legacy - replaced with getUserJobs)
         */
        this.getUserImages = async (req, res) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return;
                }
                const { characterId, page = 1, limit = 20 } = req.query;
                // TODO: Implement database query for user's generated images
                // For now, return empty response
                res.json({
                    success: true,
                    data: {
                        items: [],
                        total: 0,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        hasMore: false
                    }
                });
            }
            catch (error) {
                console.error('Error fetching user images:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch images'
                });
            }
        };
        /**
         * Check character embedding availability
         */
        this.checkEmbeddingAvailability = async (req, res) => {
            try {
                const { characterId } = req.params;
                if (!characterId) {
                    res.status(400).json({
                        success: false,
                        error: 'Character ID is required'
                    });
                    return;
                }
                const embeddingInfo = await this.embeddingService.checkEmbeddingAvailability(characterId);
                res.json({
                    success: true,
                    data: embeddingInfo
                });
            }
            catch (error) {
                console.error('Error checking embedding availability:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to check embedding availability'
                });
            }
        };
        /**
         * Delete a generated image
         */
        this.deleteImage = async (req, res) => {
            try {
                const { imageId } = req.params;
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return;
                }
                // TODO: Implement database query to verify ownership and delete image
                // Also delete from Cloudinary if needed
                res.json({
                    success: true,
                    message: 'Image deleted successfully'
                });
            }
            catch (error) {
                console.error('Error deleting image:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to delete image'
                });
            }
        };
        /**
         * Get all images for a specific character (user must own the character)
         */
        this.getCharacterImages = async (req, res) => {
            try {
                const { characterId } = req.params;
                // Get user from auth middleware
                const userId = req.user?.id;
                if (!userId) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return;
                }
                if (!characterId) {
                    res.status(400).json({
                        success: false,
                        error: 'Character ID is required'
                    });
                    return;
                }
                console.log(`📸 Getting images for character: ${characterId}, user: ${userId}`);
                const result = await this.embeddingService.getCharacterImages(userId, characterId);
                if (!result.success) {
                    res.status(500).json({
                        success: false,
                        error: result.error
                    });
                    return;
                }
                res.json({
                    success: true,
                    data: {
                        images: result.images,
                        totalCount: result.totalCount,
                        characterId: characterId
                    }
                });
            }
            catch (error) {
                console.error('Error getting character images:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get character images'
                });
            }
        };
        this.cloudinaryService = new CloudinaryFolderService();
        this.embeddingService = new EmbeddingBasedImageGenerationService();
    }
}
export default ImageGenerationController;
