import { CharacterModel } from "../db/models/CharacterModel.js";
import { TagModel } from "../db/models/TagModel.js";
import { UserModel } from "../db/models/UserModel.js";
import { CharacterImageService } from "../services/CharacterImageService.js";
import { FastCharacterGenerationService } from "../services/FastCharacterGenerationService.js";
import { ContentModerationService } from "../services/ContentModerationService.js";
import { cacheService } from "../services/CacheService.js";
import mongoose from "mongoose";
export const listCharacters = async (req, res, next) => {
    try {
        // Get query parameters
        const { randomize = 'false', limit = '50', offset = '0', excludeIds = '', mode = 'all', // 'all', 'featured', 'discover'
        page = '0', pageSize = '40' } = req.query;
        const shouldRandomize = randomize === 'true';
        const limitNum = Math.min(parseInt(limit) || 50, 1000); // Max 1000 for image generation page
        const offsetNum = parseInt(offset) || 0;
        const excludeIdsList = excludeIds ? excludeIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
        const pageNum = parseInt(page) || 0;
        const pageSizeNum = Math.min(parseInt(pageSize) || 40, 1000); // Max 1000 per page
        console.log(`📋 Fetching characters: mode=${mode}, randomize=${shouldRandomize}, limit=${limitNum}, offset=${offsetNum}, exclude=${excludeIdsList.length}, page=${pageNum}, pageSize=${pageSizeNum}`);
        // Get authenticated user for featured characters
        const authUserId = req.userId || req.user?.id;
        let userPreferences = [];
        // ===== CACHE CHECK =====
        // Don't use cache for randomized requests or if there are excluded IDs
        if (!shouldRandomize && excludeIdsList.length === 0) {
            try {
                const cachedCharacters = await cacheService.getCharacterList(mode, pageNum, authUserId);
                if (cachedCharacters && cachedCharacters.length > 0) {
                    console.log(`🎯 Cache HIT: Found ${cachedCharacters.length} cached characters for ${mode}:${pageNum}`);
                    res.set('X-Cache', 'HIT');
                    return res.json(cachedCharacters);
                }
                console.log(`💨 Cache MISS: No cached characters for ${mode}:${pageNum}`);
            }
            catch (error) {
                console.warn('⚠️ Cache read error (continuing without cache):', error);
            }
        }
        if (mode === 'featured' && authUserId) {
            try {
                const user = await UserModel.findById(authUserId).select('preferences.selectedTags').lean();
                userPreferences = user?.preferences?.selectedTags || [];
                console.log(`👤 User preferences found: ${userPreferences.length} tags`);
            }
            catch (error) {
                console.warn('⚠️ Could not fetch user preferences:', error);
            }
        }
        let chars;
        if (mode === 'featured' && userPreferences.length > 0) {
            // Featured characters: filter by user's preferred tags
            const matchConditions = {};
            // Add exclusion filter
            if (excludeIdsList.length > 0) {
                matchConditions.id = { $nin: excludeIdsList };
            }
            // Create OR conditions for each tag category
            const tagConditions = userPreferences.map(tag => ({
                $or: [
                    { [`selectedTags.personality`]: tag },
                    { [`selectedTags.character-type`]: tag },
                    { [`selectedTags.appearance`]: tag },
                    { [`selectedTags.genre`]: tag },
                    { [`selectedTags.scenario`]: tag },
                    { [`selectedTags.fantasy`]: tag },
                    { [`selectedTags.relationship`]: tag },
                    { [`selectedTags.content-rating`]: tag },
                    { [`selectedTags.art-style`]: tag }
                ]
            }));
            if (tagConditions.length > 0) {
                matchConditions.$or = tagConditions;
            }
            const pipeline = [
                { $match: matchConditions },
                { $sample: { size: limitNum } }, // Random sampling from matching characters
                {
                    $lookup: {
                        from: 'users',
                        localField: 'creatorId',
                        foreignField: '_id',
                        as: 'creatorId',
                        pipeline: [{ $project: { username: 1, avatarUrl: 1, verified: 1 } }]
                    }
                },
                {
                    $addFields: {
                        creatorId: { $arrayElemAt: ['$creatorId', 0] }
                    }
                },
                { $project: { __v: 0 } }
            ];
            chars = await CharacterModel.aggregate(pipeline);
            console.log(`✨ Found ${chars.length} featured characters matching user preferences`);
        }
        else if (mode === 'discover') {
            // Discover mode: paginated random characters
            const totalCount = await CharacterModel.countDocuments(excludeIdsList.length > 0 ? { id: { $nin: excludeIdsList } } : {});
            const skipAmount = pageNum * pageSizeNum;
            // If we've exceeded available characters, start over from beginning
            if (skipAmount >= totalCount && totalCount > 0) {
                console.log(`🔄 Resetting pagination: skipAmount=${skipAmount}, totalCount=${totalCount}`);
                const pipeline = [
                    { $match: {} }, // No exclusions when resetting
                    { $sample: { size: pageSizeNum } },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'creatorId',
                            foreignField: '_id',
                            as: 'creatorId',
                            pipeline: [{ $project: { username: 1, avatarUrl: 1, verified: 1 } }]
                        }
                    },
                    {
                        $addFields: {
                            creatorId: { $arrayElemAt: ['$creatorId', 0] }
                        }
                    },
                    { $project: { __v: 0 } }
                ];
                chars = await CharacterModel.aggregate(pipeline);
                // Return reset indicator
                res.set('X-Pagination-Reset', 'true');
                res.set('X-Total-Count', totalCount.toString());
                res.set('X-Current-Page', '0');
            }
            else {
                // Normal pagination with random sampling
                const pipeline = [
                    { $match: excludeIdsList.length > 0 ? { id: { $nin: excludeIdsList } } : {} },
                    { $sample: { size: pageSizeNum } },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'creatorId',
                            foreignField: '_id',
                            as: 'creatorId',
                            pipeline: [{ $project: { username: 1, avatarUrl: 1, verified: 1 } }]
                        }
                    },
                    {
                        $addFields: {
                            creatorId: { $arrayElemAt: ['$creatorId', 0] }
                        }
                    },
                    { $project: { __v: 0 } }
                ];
                chars = await CharacterModel.aggregate(pipeline);
                // Set pagination headers
                res.set('X-Total-Count', totalCount.toString());
                res.set('X-Current-Page', pageNum.toString());
                res.set('X-Page-Size', pageSizeNum.toString());
                res.set('X-Has-More', (skipAmount + pageSizeNum < totalCount).toString());
            }
            console.log(`🎲 Found ${chars.length} discover characters (page ${pageNum})`);
        }
        else {
            // Legacy mode: existing behavior
            let query = CharacterModel.find({}, { __v: 0 });
            // Exclude previously shown IDs if provided
            if (excludeIdsList.length > 0) {
                query = query.where('id').nin(excludeIdsList);
            }
            query = query.populate('creatorId', 'username avatarUrl verified').lean();
            if (shouldRandomize) {
                // Use MongoDB aggregation for true randomization
                const pipeline = [
                    { $match: excludeIdsList.length > 0 ? { id: { $nin: excludeIdsList } } : {} },
                    { $sample: { size: limitNum } }, // Random sampling
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'creatorId',
                            foreignField: '_id',
                            as: 'creatorId',
                            pipeline: [{ $project: { username: 1, avatarUrl: 1, verified: 1 } }]
                        }
                    },
                    {
                        $addFields: {
                            creatorId: { $arrayElemAt: ['$creatorId', 0] }
                        }
                    },
                    { $project: { __v: 0 } }
                ];
                chars = await CharacterModel.aggregate(pipeline);
            }
            else {
                // Regular pagination for non-randomized requests
                chars = await query.skip(offsetNum).limit(limitNum);
            }
        }
        // Transform the characters to include creator info
        const transformedChars = chars.map(char => ({
            ...char,
            creatorId: char.creatorId?._id?.toString() || char.creatorId?.toString() || null,
            creator: char.creatorId ? {
                username: char.creatorId.username,
                avatarUrl: char.creatorId.avatarUrl,
                verified: char.creatorId.verified
            } : null
        }));
        // ===== CACHE STORAGE =====
        // Cache the results if they're not randomized and no exclusions
        if (!shouldRandomize && excludeIdsList.length === 0 && transformedChars.length > 0) {
            cacheService.cacheCharacterList(transformedChars, mode, pageNum, authUserId)
                .then(() => console.log(`💾 Cached ${transformedChars.length} characters for ${mode}:${pageNum}`))
                .catch(error => console.warn('⚠️ Cache write error:', error));
        }
        console.log(`✅ Returning ${transformedChars.length} characters`);
        res.set('X-Cache', 'MISS');
        res.json(transformedChars);
    }
    catch (err) {
        console.error('❌ Error fetching characters:', err);
        next(err);
    }
};
export const getCharacter = async (req, res, next) => {
    try {
        const id = req.params.id;
        const numericId = parseInt(id, 10);
        // ===== CACHE CHECK =====
        try {
            const cachedCharacter = await cacheService.getCharacter(id);
            if (cachedCharacter) {
                console.log(`🎯 Cache HIT: Found cached character ${id}`);
                res.set('X-Cache', 'HIT');
                return res.json(cachedCharacter);
            }
            console.log(`💨 Cache MISS: No cached character for ${id}`);
        }
        catch (error) {
            console.warn('⚠️ Cache read error (continuing without cache):', error);
        }
        if (isNaN(numericId)) {
            return res.status(400).json({ message: "Invalid character ID" });
        }
        const char = await CharacterModel.findOne({ id: numericId }, { __v: 0 })
            .populate('creatorId', 'username avatarUrl verified')
            .lean();
        if (!char) {
            return res.status(404).json({ message: "Character not found" });
        }
        // Transform character to include creator info
        const transformedChar = {
            ...char,
            creatorId: char.creatorId?._id?.toString() || char.creatorId?.toString() || null,
            creator: char.creatorId ? {
                username: char.creatorId.username,
                avatarUrl: char.creatorId.avatarUrl,
                verified: char.creatorId.verified
            } : null
        };
        // ===== CACHE STORAGE =====
        cacheService.cacheCharacter(transformedChar)
            .then(() => console.log(`💾 Cached character ${id}`))
            .catch(error => console.warn('⚠️ Cache write error:', error));
        res.set('X-Cache', 'MISS');
        res.json(transformedChar);
    }
    catch (err) {
        next(err);
    }
};
export async function listByCreator(req, res) {
    try {
        const creatorId = req.params.creatorId;
        // Validate ObjectId format - return empty array for invalid IDs instead of error
        if (!mongoose.isValidObjectId(creatorId)) {
            console.log('❌ listByCreator: Invalid creator ID format:', creatorId);
            return res.json([]); // Return empty array for invalid IDs
        }
        const chars = await CharacterModel.find({ creatorId })
            .populate('creatorId', 'username avatarUrl verified')
            .lean();
        // Transform characters to include creator info
        const transformedChars = chars.map(char => ({
            ...char,
            creatorId: char.creatorId?._id?.toString() || char.creatorId?.toString() || null,
            creator: char.creatorId ? {
                username: char.creatorId.username,
                avatarUrl: char.creatorId.avatarUrl,
                verified: char.creatorId.verified
            } : null
        }));
        res.json(transformedChars);
    }
    catch (error) {
        console.error('❌ listByCreator error:', error);
        res.status(500).json({ message: "Failed to fetch characters by creator" });
    }
}
export async function listFollowing(req, res) {
    try {
        const userId = req.params.userId;
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        const chars = await CharacterModel.find({ followers: userId }).lean();
        res.json(chars);
    }
    catch {
        res.status(500).json({ message: "Failed to fetch followed characters" });
    }
}
export async function createCharacter(req, res) {
    try {
        console.log('🎯 Creating enhanced character...');
        console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
        console.log('👤 Request user:', req.user ? { id: req.user._id || req.user.uid, email: req.user.email } : 'No user');
        console.log('🔐 Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
        const { 
        // Basic character info
        name, description, age, quickSuggestion = '', positivePrompt, negativePrompt, isNsfw = false, isPublic = true, 
        // Enhanced character creation data
        personalityTraits = {}, artStyle = {}, selectedTags = {}, 
        // Legacy fields for backwards compatibility
        avatar, rating, chatCount = 0, creatorId } = req.body;
        console.log('📝 Extracted fields:', {
            name,
            description: description?.length + ' chars',
            quickSuggestion: quickSuggestion?.length + ' chars',
            isNsfw,
            isPublic,
            personalityTraits,
            artStyle,
            selectedTagsKeys: Object.keys(selectedTags)
        });
        // Validate required fields
        if (!name || !description) {
            console.log('❌ Validation failed: Missing name or description');
            return res.status(400).json({
                success: false,
                message: "Character name and description are required"
            });
        }
        // Validate age requirement - CRITICAL SECURITY CHECK
        if (!age || age < 18) {
            console.log('❌ Age validation failed:', { providedAge: age });
            return res.status(400).json({
                success: false,
                message: "Character age must be 18 or above. All characters must be adults."
            });
        }
        console.log('✅ Age validation passed:', { age });
        // Content moderation check - CRITICAL SECURITY CHECK
        const moderationResult = ContentModerationService.moderateCharacterContent({
            name,
            description,
            quickSuggestion
        });
        if (moderationResult.isViolation) {
            console.error('🚨 CHARACTER CREATION BLOCKED - Content violation detected:', {
                violationType: moderationResult.violationType,
                characterName: name
            });
            return res.status(400).json({
                success: false,
                message: moderationResult.blockedReason,
                code: 'CONTENT_MODERATION_VIOLATION',
                violationType: moderationResult.violationType
            });
        }
        // Get user ID from auth middleware
        const userId = req.user?.uid || req.user?._id;
        console.log('🔐 User ID extracted:', userId);
        if (!userId) {
            console.log('❌ Authentication failed: No user ID found');
            return res.status(401).json({
                success: false,
                message: "User authentication required. Please log in and try again."
            });
        }
        // Generate unique character ID (will be overridden by enhanced generation if successful)
        let characterId = Math.floor(Math.random() * 1000000) + Date.now();
        console.log('🆔 Generated character ID:', characterId);
        // Get user data for image generation
        const user = await UserModel.findById(userId);
        if (!user) {
            console.log('❌ User not found for image generation');
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        // Check coin balance for character creation (49 coins required)
        const requiredCoins = 49;
        if (user.coins === undefined || user.coins < requiredCoins) {
            console.log(`❌ Insufficient coins: User has ${user.coins}, needs ${requiredCoins}`);
            return res.status(403).json({
                success: false,
                message: `Insufficient coins. You need ${requiredCoins} coins to create a character.`
            });
        }
        console.log(`💰 User has ${user.coins} coins, proceeding with character creation (${requiredCoins} coins will be deducted)`);
        let avatarUrl = avatar;
        let imageGenerationData = {};
        let embeddingsData = {};
        let characterSeed = 0;
        // Use FastCharacterGenerationService with ComfyUI integration
        console.log('🎨 Generating character with ComfyUI via FastCharacterGenerationService...');
        try {
            const fastGenerationService = new FastCharacterGenerationService();
            // Determine style from artStyle or selectedTags
            let style = 'fantasy'; // default
            if (artStyle?.primaryStyle) {
                style = artStyle.primaryStyle;
            }
            else if (artStyle?.style) {
                style = artStyle.style; // legacy compatibility
            }
            else if (selectedTags?.['art-style']?.[0]) {
                style = selectedTags['art-style'][0];
            }
            console.log('🎨 Art style determination:', {
                artStyleObject: artStyle,
                artStylePrimary: artStyle?.primaryStyle,
                artStyleLegacy: artStyle?.style,
                selectedArtTags: selectedTags?.['art-style'],
                finalStyle: style
            });
            // Build character traits for prompt
            const traits = [];
            if (personalityTraits?.mainTrait)
                traits.push(personalityTraits.mainTrait);
            if (personalityTraits?.secondaryTraits)
                traits.push(...personalityTraits.secondaryTraits);
            if (personalityTraits?.subTraits)
                traits.push(...personalityTraits.subTraits);
            const generationOptions = {
                characterName: name,
                description: description,
                positivePrompt: positivePrompt,
                negativePrompt: negativePrompt,
                personalityTraits: {
                    mainTrait: personalityTraits?.mainTrait || 'mysterious',
                    subTraits: personalityTraits?.secondaryTraits || personalityTraits?.subTraits || traits
                },
                artStyle: { primaryStyle: typeof artStyle === 'string' ? artStyle : (artStyle?.primaryStyle || style) },
                selectedTags: selectedTags || {},
                username: user.username,
                userId: userId.toString()
            };
            console.log('🚀 Fast generating character with ComfyUI options:', generationOptions);
            const result = await fastGenerationService.generateCharacterFast(generationOptions);
            if (result.success && result.character) {
                console.log('✅ Character generation with ComfyUI successful!');
                // Deduct coins for character creation
                user.coins -= requiredCoins;
                await user.save();
                console.log(`💰 Deducted ${requiredCoins} coins for character creation. User now has ${user.coins} coins.`);
                // FastCharacterGenerationService already created the character in the database
                // Return early to avoid duplicate creation
                const responseData = {
                    success: true,
                    character: {
                        id: result.character.id,
                        name: result.character.name,
                        description: result.character.description,
                        avatar: result.character.avatar,
                        personalityTraits: result.character.personalityTraits || personalityTraits,
                        artStyle: result.character.artStyle || artStyle,
                        selectedTags: result.character.selectedTags || selectedTags,
                        createdAt: result.character.createdAt
                    },
                    message: 'Character created successfully! Your character has been saved to the database.'
                };
                console.log('📤 Sending success response for FastGen character:', JSON.stringify(responseData, null, 2));
                return res.status(201).json(responseData);
            }
            else {
                throw new Error(result.error || 'Fast generation failed');
            }
        }
        catch (fastGenError) {
            console.log('⚠️ ComfyUI generation failed, falling back to CharacterImageService:', fastGenError);
            // Fallback to original service
            const characterCreationData = {
                name,
                description,
                quickSuggestion,
                personalityTraits,
                artStyle,
                selectedTags
            };
            const imageResult = await CharacterImageService.generateCharacterAvatar(characterCreationData, userId, user.username);
            if (imageResult.success) {
                console.log('✅ Fallback image generation successful!');
                avatarUrl = imageResult.imageUrl;
                imageGenerationData = imageResult.generationData || {};
            }
            else {
                console.log('⚠️ Both AI generation methods failed, using placeholder:', imageResult.error);
                // Use local fallback placeholder image
                avatarUrl = avatar || '/placeholder-character.png';
                // Safety net: ensure avatarUrl is never undefined
                if (!avatarUrl) {
                    avatarUrl = '/placeholder-character.png';
                    console.log('⚠️ Using emergency fallback local avatar');
                }
            }
        }
        // Flatten selected tags for backward compatibility
        const allTags = Object.values(selectedTags).flat();
        console.log('🏷️ Flattened tags:', allTags);
        // Create character document
        console.log('💾 Creating character in database...');
        const characterDocumentData = {
            id: characterId,
            avatar: avatarUrl,
            name,
            description,
            age, // Add the required age field
            quickSuggestion,
            rating: rating || 'PG',
            nsfw: isNsfw,
            chatCount,
            likes: 0,
            creatorId: userId,
            // Enhanced character creation fields
            personalityTraits,
            artStyle,
            selectedTags,
            // Image generation data
            imageGeneration: imageGenerationData,
            // Embeddings data
            embeddings: embeddingsData,
            // Image metadata
            imageMetadata: {
                generationType: avatarUrl?.includes('cloudinary') ? 'generated' : (avatarUrl?.includes('placeholder') ? 'placeholder' : 'uploaded'),
                uploadedAt: new Date(),
                originalImageUrl: avatarUrl,
                cloudinaryPublicId: undefined
            },
            // Creation metadata
            creationProcess: {
                stepCompleted: 5,
                totalSteps: 5,
                isDraft: false,
                lastSavedAt: new Date(),
                timeSpent: 0
            }
        };
        console.log('📄 Character document to create:', JSON.stringify(characterDocumentData, null, 2));
        // Validate required fields before database insertion
        if (!characterDocumentData.avatar) {
            console.log('❌ CRITICAL: Avatar URL is missing!');
            return res.status(400).json({
                success: false,
                message: "Avatar URL is required but missing. This is a system error."
            });
        }
        console.log('✅ Validation check passed, creating character in database...');
        const newCharacter = await CharacterModel.create(characterDocumentData);
        console.log('✅ Character created successfully in database!');
        console.log('📊 Created character ID:', newCharacter.id);
        console.log('📊 Database _id:', newCharacter._id);
        // Deduct coins for character creation
        user.coins -= requiredCoins;
        await user.save();
        console.log(`💰 Deducted ${requiredCoins} coins for character creation. User now has ${user.coins} coins.`);
        // Update tag usage counts for newly created character
        await updateCharacterTags(newCharacter._id.toString(), selectedTags);
        const responseData = {
            success: true,
            character: {
                id: newCharacter.id,
                name: newCharacter.name,
                description: newCharacter.description,
                quickSuggestion: newCharacter.quickSuggestion,
                avatar: newCharacter.avatar,
                personalityTraits: newCharacter.personalityTraits,
                artStyle: newCharacter.artStyle,
                selectedTags: newCharacter.selectedTags,
                nsfw: newCharacter.nsfw,
                createdAt: newCharacter.createdAt
            },
            message: 'Character created successfully! Your character has been saved to the database.'
        };
        console.log('📤 Sending success response:', JSON.stringify(responseData, null, 2));
        // ===== CACHE INVALIDATION =====
        // Invalidate character lists since a new character was created
        cacheService.invalidateCharacterCaches()
            .then(() => console.log(`🧹 Invalidated character list caches after creating character ${newCharacter.id}`))
            .catch(error => console.warn('⚠️ Cache invalidation error:', error));
        res.status(201).json(responseData);
    }
    catch (err) {
        console.error("❌ Character creation error:", err);
        let errorMessage = "Failed to create character";
        let statusCode = 500;
        if (err instanceof Error) {
            console.error("❌ Error details:", {
                name: err.name,
                message: err.message,
                stack: err.stack
            });
            if (err.message.includes('validation failed')) {
                statusCode = 400;
                errorMessage = "Character data validation failed";
            }
            else if (err.message.includes('duplicate key')) {
                statusCode = 409;
                errorMessage = "Character with this name already exists";
            }
        }
        const errorResponse = {
            success: false,
            message: errorMessage,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
        console.log('📤 Sending error response:', JSON.stringify(errorResponse, null, 2));
        res.status(statusCode).json(errorResponse);
    }
}
export async function updateCharacter(req, res) {
    try {
        const id = req.params.id;
        const numericId = parseInt(id, 10);
        const { selectedTags, ...updates } = req.body;
        if (isNaN(numericId)) {
            return res.status(400).json({ message: "Invalid character ID" });
        }
        const updatedCharacter = await CharacterModel.findOneAndUpdate({ id: numericId }, updates, { new: true });
        if (!updatedCharacter) {
            return res.status(404).json({ message: "Character not found" });
        }
        // Update tag usage counts if selectedTags are provided
        if (selectedTags) {
            await updateCharacterTags(updatedCharacter._id.toString(), selectedTags);
        }
        // ===== CACHE INVALIDATION =====
        cacheService.invalidateCharacterCaches(id)
            .then(() => console.log(`🧹 Invalidated caches for updated character ${id}`))
            .catch(error => console.warn('⚠️ Cache invalidation error:', error));
        res.json(updatedCharacter);
    }
    catch (err) {
        console.error("UpdateCharacter error:", err);
        res.status(500).json({ message: "Failed to update character" });
    }
}
export async function deleteCharacter(req, res) {
    try {
        const id = req.params.id;
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            return res.status(400).json({ message: "Invalid character ID" });
        }
        const deleted = await CharacterModel.findOneAndDelete({ id: numericId });
        if (!deleted) {
            return res.status(404).json({ message: "Character not found" });
        }
        // Decrement tag usage counts for deleted character
        if (deleted.selectedTags) {
            await updateCharacterTags(deleted._id.toString(), {}, deleted.selectedTags); // Pass empty newSelectedTags to decrement all old tags
        }
        // ===== CACHE INVALIDATION =====
        cacheService.invalidateCharacterCaches(numericId)
            .then(() => console.log(`🧹 Invalidated caches for deleted character ${numericId}`))
            .catch(error => console.warn('⚠️ Cache invalidation error:', error));
        res.json({ message: "Character deleted successfully" });
    }
    catch (err) {
        console.error("DeleteCharacter error:", err);
        res.status(500).json({ message: "Failed to delete character" });
    }
}
;
// Tag-related endpoints for characters (DISABLED - incompatible with new selectedTags structure)
/*
export const addTagToCharacter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const characterId = req.params.id;
    const { tagId } = req.body;

    if (!mongoose.isValidObjectId(tagId)) {
      return res.status(400).json({ message: "Invalid tag ID" });
    }

    // Verify tag exists
    const tag = await TagModel.findById(tagId);
    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    // Update character
    const character = await CharacterModel.findByIdAndUpdate(
      characterId,
      {
        $addToSet: {
          tags: tagId,
          tagNames: tag.name
        }
      },
      { new: true }
    ).populate('tags');

    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    // Increment tag usage count
    await TagModel.findByIdAndUpdate(tagId, { $inc: { usageCount: 1 } });

    res.json(character);
  } catch (err) {
    next(err);
  }
};
*/
/*
export const removeTagFromCharacter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const characterId = req.params.id;
    const tagId = req.params.tagId;

    if (!mongoose.isValidObjectId(tagId)) {
      return res.status(400).json({ message: "Invalid tag ID" });
    }

    // Get tag name for removal
    const tag = await TagModel.findById(tagId);
    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    // Update character
    const character = await CharacterModel.findByIdAndUpdate(
      characterId,
      {
        $pull: {
          tags: tagId,
          tagNames: tag.name
        }
      },
      { new: true }
    ).populate('tags');

    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    // Decrement tag usage count (don't go below 0)
    await TagModel.findByIdAndUpdate(tagId, {
      $inc: { usageCount: -1 },
      $max: { usageCount: 0 }
    });

    res.json(character);
  } catch (err) {
    next(err);
  }
};
*/
/*
export const updateCharacterTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const characterId = req.params.id;
    const { tagIds } = req.body;

    if (!Array.isArray(tagIds)) {
      return res.status(400).json({ message: "tagIds must be an array" });
    }

    // Validate all tag IDs
    for (const tagId of tagIds) {
      if (!mongoose.isValidObjectId(tagId)) {
        return res.status(400).json({ message: `Invalid tag ID: ${tagId}` });
      }
    }

    // Get current character
    const currentCharacter = await CharacterModel.findById(characterId);
    if (!currentCharacter) {
      return res.status(404).json({ message: "Character not found" });
    }

    // Get new tags
    const newTags = await TagModel.find({ _id: { $in: tagIds } });
    if (newTags.length !== tagIds.length) {
      return res.status(400).json({ message: "One or more tags not found" });
    }

    // Calculate tag changes for usage count updates
    const currentTagIds = currentCharacter.tags.map(id => id.toString());
    const addedTags = tagIds.filter(id => !currentTagIds.includes(id));
    const removedTags = currentTagIds.filter(id => !tagIds.includes(id));

    // Update character tags
    const character = await CharacterModel.findByIdAndUpdate(
      characterId,
      {
        tags: tagIds,
        tagNames: newTags.map(tag => tag.name)
      },
      { new: true }
    ).populate('tags');

    // Update tag usage counts
    if (addedTags.length > 0) {
      await TagModel.updateMany(
        { _id: { $in: addedTags } },
        { $inc: { usageCount: 1 } }
      );
    }
    
    if (removedTags.length > 0) {
      await TagModel.updateMany(
        { _id: { $in: removedTags } },
        { $inc: { usageCount: -1 } }
      );
    }

    res.json(character);
  } catch (err) {
    next(err);
  }
};
*/
export const updateCharacterTags = async (characterId, newSelectedTags, oldSelectedTags) => {
    try {
        // Flatten the new selected tags into a single array of tag names
        const newTagNames = Object.values(newSelectedTags).flat();
        // Find the actual TagModel documents for the new tags
        const newTags = await TagModel.find({ name: { $in: newTagNames } });
        const newTagIds = newTags.map(tag => tag._id);
        let currentTagIds = [];
        let currentTagNames = [];
        if (oldSelectedTags) {
            // If oldSelectedTags are provided (e.g., for character deletion),
            // use them to determine tags to decrement.
            currentTagNames = Object.values(oldSelectedTags).flat();
            const oldTags = await TagModel.find({ name: { $in: currentTagNames } });
            currentTagIds = oldTags.map(tag => tag._id);
        }
        else {
            // Otherwise, get current character to determine existing tags
            const currentCharacter = await CharacterModel.findById(characterId);
            if (!currentCharacter) {
                console.warn(`Character with ID ${characterId} not found for tag update.`);
                return;
            }
            currentTagIds = currentCharacter.tags;
            currentTagNames = currentCharacter.tagNames || [];
        }
        // Calculate added and removed tags based on their IDs
        const addedTagIds = newTagIds.filter(id => !currentTagIds.some(currentId => currentId.equals(id)));
        const removedTagIds = currentTagIds.filter(id => !newTagIds.some(newId => newId.equals(id)));
        // Update character's tags and tagNames fields (only if not deleting)
        if (newTagIds.length > 0 || newTagNames.length > 0) { // Only update if there are new tags or if it's not a deletion scenario
            await CharacterModel.findByIdAndUpdate(characterId, {
                tags: newTagIds,
                tagNames: newTagNames
            }, { new: true });
        }
        // Increment usageCount for newly added tags
        if (addedTagIds.length > 0) {
            await TagModel.updateMany({ _id: { $in: addedTagIds } }, { $inc: { usageCount: 1 } });
            console.log(`Incremented usageCount for tags: ${addedTagIds.join(', ')}`);
        }
        // Decrement usageCount for removed tags
        if (removedTagIds.length > 0) {
            await TagModel.updateMany({ _id: { $in: removedTagIds } }, { $inc: { usageCount: -1 } });
            console.log(`Decremented usageCount for tags: ${removedTagIds.join(', ')}`);
        }
    }
    catch (err) {
        console.error("Error updating character tags and usage counts:", err);
    }
};
export const likeCharacter = async (req, res, next) => {
    try {
        const characterId = req.params.id;
        const numericId = parseInt(characterId, 10);
        if (isNaN(numericId)) {
            return res.status(400).json({ message: "Invalid character ID" });
        }
        const character = await CharacterModel.findOneAndUpdate({ id: numericId }, { $inc: { likes: 1 } }, { new: true });
        if (!character) {
            return res.status(404).json({ message: "Character not found" });
        }
        res.json(character);
    }
    catch (err) {
        next(err);
    }
};
export const unlikeCharacter = async (req, res, next) => {
    try {
        const characterId = req.params.id;
        const numericId = parseInt(characterId, 10);
        if (isNaN(numericId)) {
            return res.status(400).json({ message: "Invalid character ID" });
        }
        const character = await CharacterModel.findOneAndUpdate({ id: numericId }, { $inc: { likes: -1 } }, { new: true });
        if (!character) {
            return res.status(404).json({ message: "Character not found" });
        }
        res.json(character);
    }
    catch (err) {
        next(err);
    }
};
export const toggleLike = async (req, res, next) => {
    try {
        const characterId = req.params.id;
        const numericId = parseInt(characterId, 10);
        const userId = req.userId || req.user?.id;
        if (isNaN(numericId)) {
            return res.status(400).json({ message: "Invalid character ID" });
        }
        if (!userId) {
            return res.status(401).json({ message: "User authentication required" });
        }
        // Check if user has already liked this character
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Initialize likedCharacters if it doesn't exist
        if (!user.likedCharacters) {
            user.likedCharacters = [];
        }
        const hasLiked = user.likedCharacters.includes(numericId);
        let character;
        if (hasLiked) {
            // Unlike: remove from user's liked characters and decrement character likes
            user.likedCharacters = user.likedCharacters.filter(id => id !== numericId);
            await user.save();
            character = await CharacterModel.findOneAndUpdate({ id: numericId }, { $inc: { likes: -1 } }, { new: true });
        }
        else {
            // Like: add to user's liked characters and increment character likes
            user.likedCharacters.push(numericId);
            await user.save();
            character = await CharacterModel.findOneAndUpdate({ id: numericId }, { $inc: { likes: 1 } }, { new: true });
        }
        if (!character) {
            return res.status(404).json({ message: "Character not found" });
        }
        res.json({
            likes: character.likes,
            isLiked: !hasLiked,
            message: hasLiked ? "Character unliked" : "Character liked"
        });
    }
    catch (err) {
        next(err);
    }
};
export const getCharactersByTags = async (req, res, next) => {
    try {
        const { tags, includeNSFW } = req.query;
        let tagArray = [];
        if (typeof tags === 'string') {
            tagArray = tags.split(',').map(tag => tag.trim());
        }
        else if (Array.isArray(tags)) {
            tagArray = tags;
        }
        const query = {};
        if (tagArray.length > 0) {
            // Search within the selectedTags object for any matching tags
            const tagQueries = tagArray.map(tag => ({
                $or: [
                    { 'selectedTags.character-type': tag },
                    { 'selectedTags.genre': tag },
                    { 'selectedTags.personality': tag },
                    { 'selectedTags.appearance': tag },
                    { 'selectedTags.origin': tag },
                    { 'selectedTags.sexuality': tag },
                    { 'selectedTags.fantasy': tag },
                    { 'selectedTags.content-rating': tag },
                    { 'selectedTags.ethnicity': tag },
                    { 'selectedTags.scenario': tag }
                ]
            }));
            query.$and = tagQueries;
        }
        if (includeNSFW !== 'true') {
            query.isNsfw = { $ne: true };
        }
        const characters = await CharacterModel.find(query)
            .populate('creatorId', 'username avatarUrl verified')
            .lean();
        res.json(characters);
    }
    catch (err) {
        next(err);
    }
};
/**
 * Get character embedding generation status
 * GET /api/characters/:id/embedding-status
 */
export async function getEmbeddingStatus(req, res) {
    try {
        const characterId = req.params.id;
        const numericId = parseInt(characterId, 10);
        if (isNaN(numericId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid character ID"
            });
        }
        const character = await CharacterModel.findOne({ id: numericId });
        if (!character) {
            return res.status(404).json({
                success: false,
                message: "Character not found"
            });
        }
        const embeddingData = character.embeddings?.imageEmbeddings;
        if (!embeddingData) {
            return res.json({
                success: true,
                status: 'not_started',
                message: 'Embedding generation has not been started for this character'
            });
        }
        res.json({
            success: true,
            status: embeddingData.status || 'pending',
            totalImages: embeddingData.totalImages || 0,
            generationStartedAt: embeddingData.generationStartedAt,
            generationCompletedAt: embeddingData.generationCompletedAt,
            version: embeddingData.version,
            cloudinaryUrls: embeddingData.cloudinaryUrls || [],
            message: `Embedding generation is ${embeddingData.status || 'pending'}`
        });
    }
    catch (error) {
        console.error('❌ Get embedding status error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to get embedding status",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
/**
 * Generate new image for existing character using img2img for consistency
 * POST /api/characters/:id/regenerate-image
 */
export async function regenerateCharacterImage(req, res) {
    try {
        console.log('🎭 Starting character image regeneration...');
        const characterId = req.params.id;
        const { newPrompt, denoisingStrength = 0.2 } = req.body;
        const userId = req.userId;
        console.log('📋 Regeneration request:', {
            characterId,
            newPrompt: newPrompt?.substring(0, 100) + '...',
            denoisingStrength,
            userId
        });
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }
        if (!newPrompt) {
            return res.status(400).json({
                success: false,
                message: "New prompt is required for image regeneration"
            });
        }
        // Find the character
        const character = await CharacterModel.findOne({ id: parseInt(characterId) });
        if (!character) {
            return res.status(404).json({
                success: false,
                message: "Character not found"
            });
        }
        // Check if user owns the character or has permission
        if (character.creatorId?.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only regenerate images for your own characters"
            });
        }
        // Get user data
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        console.log('✅ Character found, generating new image...');
        // Generate new image using img2img for consistency
        const imageResult = await CharacterImageService.generateCharacterConsistentImage(characterId, character.avatar, // Use current character image as base
        newPrompt, {
            name: character.name,
            description: character.description,
            artStyle: character.artStyle,
            selectedTags: character.selectedTags
        }, userId, user.username, denoisingStrength);
        if (!imageResult.success) {
            console.error('❌ Image regeneration failed:', imageResult.error);
            return res.status(500).json({
                success: false,
                message: "Failed to regenerate character image",
                error: imageResult.error
            });
        }
        console.log('✅ Image regeneration successful!');
        // Optionally update character's avatar with new image
        // Or save as alternative version
        const updatedCharacter = await CharacterModel.findOneAndUpdate({ id: parseInt(characterId) }, {
            avatar: imageResult.imageUrl,
            $push: {
                'imageMetadata.altVersions': {
                    url: character.avatar, // Save previous image as alt version
                    cloudinaryPublicId: character.imageMetadata?.cloudinaryPublicId,
                    prompt: 'Original character image',
                    seed: character.imageGeneration?.seed
                }
            },
            imageGeneration: {
                ...character.imageGeneration,
                ...imageResult.generationData,
                lastRegeneratedAt: new Date()
            }
        }, { new: true });
        res.json({
            success: true,
            message: "Character image regenerated successfully!",
            character: {
                id: updatedCharacter?.id,
                name: updatedCharacter?.name,
                avatar: updatedCharacter?.avatar,
                previousImage: character.avatar
            },
            generationData: imageResult.generationData
        });
    }
    catch (error) {
        console.error('❌ Character image regeneration error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to regenerate character image",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
export const searchCharacters = async (req, res, next) => {
    try {
        const { q: query, limit = '50', page = '0' } = req.query;
        if (!query || typeof query !== 'string' || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Search query must be at least 2 characters long"
            });
        }
        const searchQuery = query.trim();
        const limitNum = Math.min(parseInt(limit) || 50, 100);
        const pageNum = parseInt(page) || 0;
        const skip = pageNum * limitNum;
        console.log(`🔍 Searching characters: query="${searchQuery}", limit=${limitNum}, page=${pageNum}`);
        // Create search conditions
        const searchConditions = {
            $or: [
                // Search in name (case-insensitive)
                { name: { $regex: searchQuery, $options: 'i' } },
                // Search in description (case-insensitive)
                { description: { $regex: searchQuery, $options: 'i' } },
                // Search in persona (case-insensitive)
                { persona: { $regex: searchQuery, $options: 'i' } },
                // Search in selectedTags (nested object search)
                {
                    $or: [
                        { 'selectedTags.personality': { $regex: searchQuery, $options: 'i' } },
                        { 'selectedTags.character-type': { $regex: searchQuery, $options: 'i' } },
                        { 'selectedTags.appearance': { $regex: searchQuery, $options: 'i' } },
                        { 'selectedTags.genre': { $regex: searchQuery, $options: 'i' } },
                        { 'selectedTags.scenario': { $regex: searchQuery, $options: 'i' } },
                        { 'selectedTags.fantasy': { $regex: searchQuery, $options: 'i' } },
                        { 'selectedTags.relationship': { $regex: searchQuery, $options: 'i' } },
                        { 'selectedTags.content-rating': { $regex: searchQuery, $options: 'i' } },
                        { 'selectedTags.art-style': { $regex: searchQuery, $options: 'i' } }
                    ]
                },
                // Search in legacy tagNames array
                { tagNames: { $regex: searchQuery, $options: 'i' } }
            ]
        };
        // Get total count for pagination
        const totalCount = await CharacterModel.countDocuments(searchConditions);
        // Execute search with pagination
        const characters = await CharacterModel.find(searchConditions)
            .sort({
            chatCount: -1, // Sort by popularity first
            likes: -1
        })
            .skip(skip)
            .limit(limitNum)
            .lean();
        console.log(`✅ Search completed: found ${characters.length} characters out of ${totalCount} total matches`);
        res.json({
            success: true,
            data: characters,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitNum),
                hasNext: (pageNum + 1) * limitNum < totalCount,
                hasPrev: pageNum > 0
            },
            searchQuery
        });
    }
    catch (error) {
        console.error('❌ Character search error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to search characters",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
