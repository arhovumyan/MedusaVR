import express from 'express';
import ImageGenerationController from '../controllers/imageGeneration.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { ImageModerationService } from '../services/ImageModerationService.js';
const router = express.Router();
const imageController = new ImageGenerationController();
// Get available models and styles (no authentication required)
router.get('/models', imageController.getModels);
// Health check for RunPod service (no authentication required)
router.get('/health', imageController.healthCheck);
// All other image generation routes require authentication
router.use(requireAuth);
// Generate new image (async - returns job ID) - with content moderation
router.post('/generate', ImageModerationService.moderateImageGeneration, imageController.generateImage);
// Generate new image with immediate RunPod URL response (optimized) - with content moderation
router.post('/generate-immediate', ImageModerationService.moderateImageGeneration, imageController.generateImageImmediate);
// Job management routes
router.get('/jobs/:jobId', imageController.getJobStatus);
router.get('/jobs', imageController.getUserJobs);
router.delete('/jobs/:jobId', imageController.cancelJob);
// Check character embedding availability
router.get('/embeddings/:characterId', imageController.checkEmbeddingAvailability);
// Get all images for a specific character
router.get('/character/:characterId', imageController.getCharacterImages);
// Get user's generated images
router.get('/', imageController.getUserImages);
// Delete a generated image
router.delete('/:imageId', imageController.deleteImage);
export default router;
