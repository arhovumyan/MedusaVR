import { CharacterModel } from '../db/models/CharacterModel.js';
import { UserModel } from '../db/models/UserModel.js';
import textualInversionService from '../services/TextualInversionService.js';
/**
 * Train textual inversion embedding for a character
 * POST /api/characters/:id/train-embedding
 */
export async function trainCharacterEmbedding(req, res) {
    try {
        const { id: characterId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        // Get character and verify ownership
        const character = await CharacterModel.findOne({ id: parseInt(characterId) });
        if (!character) {
            return res.status(404).json({
                success: false,
                error: 'Character not found'
            });
        }
        if (character.creatorId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                error: 'You can only train embeddings for your own characters'
            });
        }
        // Check if character has embedding images
        const embeddingData = character.embeddings?.imageEmbeddings;
        if (!embeddingData || !embeddingData.bunnyUrls || embeddingData.bunnyUrls.length < 5) {
            return res.status(400).json({
                success: false,
                error: `Character needs at least 5 embedding images for training (currently has ${embeddingData?.bunnyUrls?.length || 0})`
            });
        }
        // Check if embedding is already trained
        if (character.embeddings?.textualInversion?.embeddingName) {
            return res.status(200).json({
                success: true,
                message: 'Character already has a trained textual inversion embedding',
                embedding: {
                    name: character.embeddings.textualInversion.embeddingName,
                    url: character.embeddings.textualInversion.embeddingUrl
                }
            });
        }
        // Get user info for folder structure
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        // Start training (this runs in background and can take 10-30 minutes)
        console.log(`🧠 Starting textual inversion training for character: ${character.name}`);
        // Return immediately with job started status
        res.json({
            success: true,
            message: 'Textual inversion training started. This process can take 10-30 minutes.',
            character: {
                id: character.id,
                name: character.name
            },
            embeddingImages: embeddingData.bunnyUrls.length,
            estimatedTime: '10-30 minutes'
        });
        // Start training in background
        const trainingResult = await textualInversionService.trainTextualInversionEmbedding({
            characterId: characterId,
            characterName: character.name,
            username: user.username,
            embeddingImages: embeddingData.bunnyUrls,
            steps: 1000,
            learningRate: 0.005
        });
        if (trainingResult.success) {
            console.log(`🎉 Textual inversion training completed for ${character.name}: ${trainingResult.embeddingName}`);
        }
        else {
            console.error(`❌ Textual inversion training failed for ${character.name}: ${trainingResult.error}`);
        }
    }
    catch (error) {
        console.error('Error training character embedding:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}
/**
 * Get character embedding status
 * GET /api/characters/:id/embedding-status
 */
export async function getCharacterEmbeddingStatus(req, res) {
    try {
        const { id: characterId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const character = await CharacterModel.findOne({ id: parseInt(characterId) });
        if (!character) {
            return res.status(404).json({
                success: false,
                error: 'Character not found'
            });
        }
        if (character.creatorId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        const imageEmbeddings = character.embeddings?.imageEmbeddings;
        const textualInversion = character.embeddings?.textualInversion;
        res.json({
            success: true,
            character: {
                id: character.id,
                name: character.name
            },
            imageEmbeddings: {
                status: imageEmbeddings?.status || 'not_started',
                totalImages: imageEmbeddings?.totalImages || 0,
                imagesAvailable: imageEmbeddings?.bunnyUrls?.length || 0,
                completedAt: imageEmbeddings?.generationCompletedAt
            },
            textualInversion: {
                status: textualInversion ? 'completed' : 'not_trained',
                embeddingName: textualInversion?.embeddingName,
                embeddingUrl: textualInversion?.embeddingUrl,
                trainedAt: textualInversion?.trainedAt,
                trainingSteps: textualInversion?.trainingSteps,
                trainingImages: textualInversion?.trainingImages
            },
            canTrain: {
                hasEnoughImages: (imageEmbeddings?.bunnyUrls?.length || 0) >= 5,
                isAlreadyTrained: !!textualInversion?.embeddingName,
                recommendedMinImages: 8
            }
        });
    }
    catch (error) {
        console.error('Error getting character embedding status:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}
/**
 * List all characters with their embedding status
 * GET /api/characters/embedding-status
 */
export async function listCharacterEmbeddings(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const characters = await CharacterModel.find({ creatorId: userId }).select('id name embeddings createdAt');
        const embeddingStatus = characters.map(character => {
            const imageEmbeddings = character.embeddings?.imageEmbeddings;
            const textualInversion = character.embeddings?.textualInversion;
            return {
                id: character.id,
                name: character.name,
                createdAt: character.createdAt,
                imageEmbeddings: {
                    status: imageEmbeddings?.status || 'not_started',
                    totalImages: imageEmbeddings?.totalImages || 0
                },
                textualInversion: {
                    status: textualInversion ? 'completed' : 'not_trained',
                    embeddingName: textualInversion?.embeddingName,
                    trainedAt: textualInversion?.trainedAt
                },
                canTrain: (imageEmbeddings?.bunnyUrls?.length || 0) >= 5 && !textualInversion?.embeddingName
            };
        });
        res.json({
            success: true,
            characters: embeddingStatus,
            summary: {
                total: characters.length,
                withImageEmbeddings: embeddingStatus.filter(c => c.imageEmbeddings.status === 'completed').length,
                withTextualInversion: embeddingStatus.filter(c => c.textualInversion.status === 'completed').length,
                canTrain: embeddingStatus.filter(c => c.canTrain).length
            }
        });
    }
    catch (error) {
        console.error('Error listing character embeddings:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}
