import { EmbeddingBasedImageGenerationService } from './services/EmbeddingBasedImageGenerationService.js';
import { CharacterModel } from './db/models/CharacterModel.js';
import mongoose from 'mongoose';
async function testCharacterImageGeneration() {
    console.log('🧪 Testing Character Image Generation with EmbeddingBasedImageGenerationService...');
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.DB_NAME || 'aicompanion'
        });
        console.log('✅ Connected to database');
        // Find a character with embeddings
        const character = await CharacterModel.findOne({ embeddings: { $exists: true, $ne: null } }).lean();
        if (!character) {
            console.log('❌ No character with embeddings found');
            process.exit(1);
        }
        console.log(`🎭 Testing with character: ${character.name} (ID: ${character.id})`);
        // Initialize the service
        const imageService = new EmbeddingBasedImageGenerationService();
        // Test image generation with the proper interface
        const result = await imageService.generateImageWithEmbedding({
            characterId: character.id.toString(),
            prompt: `${character.name} portrait, confident expression, mystical forest background`,
            negativePrompt: 'low quality, blurry, distorted',
            width: 1024,
            height: 1536,
            steps: 25,
            cfgScale: 8,
            quantity: 2 // Test multiple images
        });
        console.log('✅ Image generation completed!');
        console.log('📷 Result:', {
            success: result.success,
            imageUrls: result.imageUrls,
            imageUrl: result.imageUrl,
            usedEmbedding: result.usedEmbedding,
            generatedCount: result.generatedCount,
            generationTime: result.generationTime,
            error: result.error
        });
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
    finally {
        process.exit(0);
    }
}
testCharacterImageGeneration();
