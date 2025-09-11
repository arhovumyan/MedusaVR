import { Router } from "express";
import { listCharacters, getCharacter, listByCreator, listFollowing, createCharacter, deleteCharacter, 
// addTagToCharacter,           // DISABLED - incompatible with new selectedTags structure
// removeTagFromCharacter,      // DISABLED - incompatible with new selectedTags structure
// updateCharacterTags,         // DISABLED - incompatible with new selectedTags structure
getCharactersByTags, likeCharacter, unlikeCharacter, toggleLike, regenerateCharacterImage } from "../controllers/character.js";
import { trainCharacterEmbedding, getCharacterEmbeddingStatus, listCharacterEmbeddings } from "../controllers/embeddingController.js";
import { createTestCharacter } from "../controllers/testCharacter.js";
import { requireAuth } from "../middleware/auth.js";
import { checkPermission } from "../middleware/tierPermissions.js";
import { EmbeddingBasedImageGenerationService } from '../services/EmbeddingBasedImageGenerationService.js';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { UserModel } from '../db/models/UserModel.js';
import { ImageModerationService } from '../services/ImageModerationService.js';
const router = Router();
router
    .get("/", listCharacters)
    .get("/by-tags", getCharactersByTags)
    .get("/embedding-status", requireAuth, listCharacterEmbeddings)
    .get("/auth-test", requireAuth, (req, res) => {
    res.json({
        success: true,
        message: "Authentication working!",
        user: {
            id: req.user?._id || req.user?.uid,
            email: req.user?.email
        }
    });
})
    .get("/:id", getCharacter)
    .get("/:id/embedding-status", requireAuth, getCharacterEmbeddingStatus)
    .get("/creator/:creatorId", listByCreator)
    .get("/following/:userId", listFollowing)
    .post("/", requireAuth, checkPermission('canCreateCharacters'), createCharacter)
    .post("/:id/train-embedding", requireAuth, trainCharacterEmbedding)
    .post("/:id/regenerate-image", requireAuth, regenerateCharacterImage)
    .post("/:id/generate-image", requireAuth, checkPermission('canCreateCharacters'), ImageModerationService.moderateImageGeneration, async (req, res) => {
    try {
        const characterId = req.params.id;
        const { imageType = 'portrait', customPrompt, mood, setting, quantity = 1 } = req.body;
        // Get character details
        const character = await CharacterModel.findOne({ id: parseInt(characterId) });
        if (!character) {
            return res.status(404).json({ success: false, message: 'Character not found' });
        }
        // Get user details
        const user = await UserModel.findById(req.user?.uid || req.user?._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Build prompt based on request
        let prompt = `${character.name}`;
        if (customPrompt) {
            prompt = customPrompt;
        }
        else {
            prompt += `, ${imageType} style`;
            if (mood)
                prompt += `, ${mood} mood`;
            if (setting)
                prompt += `, ${setting} setting`;
        }
        // Generate new image for character using embedding-based service
        const imageGenService = new EmbeddingBasedImageGenerationService();
        const result = await imageGenService.generateImageWithEmbedding({
            characterId: character.id.toString(),
            prompt: prompt,
            negativePrompt: 'low quality, blurry, distorted',
            width: 1024,
            height: 1536,
            steps: 25,
            cfgScale: 8,
            quantity: quantity,
            currentUserId: user._id.toString(), // Pass current user ID
            artStyle: character.artStyle?.primaryStyle // Pass character's art style
        });
        if (result.success) {
            res.json({
                success: true,
                imageUrl: result.imageUrl,
                imageUrls: result.imageUrls,
                generatedCount: result.generatedCount,
                usedEmbedding: result.usedEmbedding,
                generationTime: result.generationTime
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: result.error || 'Image generation failed'
            });
        }
    }
    catch (error) {
        console.error('Character image generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
})
    .delete("/:id", requireAuth, deleteCharacter)
    // Tag management routes (DISABLED - incompatible with new selectedTags structure)
    // .post("/:id/tags", requireAuth, addTagToCharacter)
    // .delete("/:id/tags/:tagId", requireAuth, removeTagFromCharacter)
    // .put("/:id/tags", requireAuth, updateCharacterTags)
    // Like/Unlike routes
    .post("/:id/likes", requireAuth, likeCharacter)
    .delete("/:id/likes", requireAuth, unlikeCharacter)
    .put("/:id/likes", requireAuth, toggleLike)
    // Test character creation (temporary for development)
    .post("/test/create", createTestCharacter);
export default router;
