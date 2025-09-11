import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { ConversationModel } from '../db/models/ConversationModel.js';
import { MessageModel } from '../db/models/MessageModel.js';
import { ChatsModel } from '../db/models/ChatsModel.js'; // Add old chat model
import { CharacterModel } from '../db/models/CharacterModel.js';
import { countWords, updateCharacterWordCount, updateAllCharacterWordCounts } from '../utils/wordCountUtils.js';
const router = Router();
/**
 * Get word count statistics for a character (all users)
 * Returns: { userWords: number, characterWords: number, totalWords: number }
 */
router.get('/character/:characterId', async (req, res) => {
    try {
        const { characterId } = req.params;
        let userWords = 0;
        let characterWords = 0;
        console.log(`🔍 [DEBUG] Looking for character ${characterId}`);
        // Method 1: Check conversations collection with embedded messages
        const conversations = await ConversationModel.find({
            characterId: parseInt(characterId)
        }).lean();
        console.log(`🔍 [DEBUG] Found ${conversations.length} conversations for character ${characterId}`);
        for (const conversation of conversations) {
            if (conversation.messages && Array.isArray(conversation.messages)) {
                for (const message of conversation.messages) {
                    const wordCount = countWords(message.content);
                    if (message.senderType === 'user') {
                        userWords += wordCount;
                    }
                    else if (message.senderType === 'ai') {
                        characterWords += wordCount;
                    }
                }
            }
        }
        console.log(`🔍 [DEBUG] After conversations check - userWords: ${userWords}, characterWords: ${characterWords}`);
        // Method 2: Also check separate messages collection
        const conversationIds = conversations.map(conv => conv._id);
        if (conversationIds.length > 0) {
            const separateMessages = await MessageModel.find({
                conversationId: { $in: conversationIds }
            }).lean();
            console.log(`🔍 [DEBUG] Found ${separateMessages.length} separate messages`);
            for (const message of separateMessages) {
                const wordCount = countWords(message.content);
                if (message.sender === 'user') {
                    userWords += wordCount;
                }
                else if (message.sender === 'ai') {
                    characterWords += wordCount;
                }
            }
        }
        console.log(`🔍 [DEBUG] After separate messages - userWords: ${userWords}, characterWords: ${characterWords}`);
        // Method 3: Check old chats collection
        const oldChats = await ChatsModel.find({
            characterId: parseInt(characterId)
        }).lean();
        console.log(`🔍 [DEBUG] Found ${oldChats.length} old chats for character ${characterId}`);
        for (const chat of oldChats) {
            if (chat.messages && Array.isArray(chat.messages)) {
                console.log(`🔍 [DEBUG] Chat has ${chat.messages.length} messages`);
                for (const message of chat.messages) {
                    const wordCount = countWords(message.content);
                    console.log(`🔍 [DEBUG] Message: senderType=${message.senderType}, words=${wordCount}, content=${message.content?.substring(0, 30)}...`);
                    if (message.senderType === 'user') {
                        userWords += wordCount;
                    }
                    else if (message.senderType === 'ai') {
                        characterWords += wordCount;
                    }
                }
            }
        }
        console.log(`🔍 [DEBUG] Final counts - userWords: ${userWords}, characterWords: ${characterWords}`);
        res.json({
            success: true,
            userWords,
            characterWords,
            totalWords: userWords + characterWords,
            chatCount: conversations.length + oldChats.length
        });
    }
    catch (error) {
        console.error('Error calculating word stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate word statistics'
        });
    }
});
/**
 * Get word count statistics for all characters
 * Returns an object with characterId as key and word stats as value
 */
router.get('/all-characters', async (req, res) => {
    try {
        // Get all characters
        const characters = await CharacterModel.find({}, 'id name');
        const wordStats = {};
        console.log(`🔍 [DEBUG] Processing ${characters.length} characters for word stats`);
        // Calculate stats for each character
        for (const character of characters) {
            let userWords = 0;
            let characterWords = 0;
            // Method 1: Check conversations collection with embedded messages
            const conversations = await ConversationModel.find({
                characterId: character.id
            }).lean();
            for (const conversation of conversations) {
                if (conversation.messages && Array.isArray(conversation.messages)) {
                    for (const message of conversation.messages) {
                        const wordCount = countWords(message.content);
                        if (message.senderType === 'user') {
                            userWords += wordCount;
                        }
                        else if (message.senderType === 'ai') {
                            characterWords += wordCount;
                        }
                    }
                }
            }
            // Method 2: Also check separate messages collection
            const conversationIds = conversations.map(conv => conv._id);
            if (conversationIds.length > 0) {
                const separateMessages = await MessageModel.find({
                    conversationId: { $in: conversationIds }
                }).lean();
                for (const message of separateMessages) {
                    const wordCount = countWords(message.content);
                    if (message.sender === 'user') {
                        userWords += wordCount;
                    }
                    else if (message.sender === 'ai') {
                        characterWords += wordCount;
                    }
                }
            }
            // Method 3: Check old chats collection
            const oldChats = await ChatsModel.find({
                characterId: character.id
            }).lean();
            for (const chat of oldChats) {
                if (chat.messages && Array.isArray(chat.messages)) {
                    for (const message of chat.messages) {
                        const wordCount = countWords(message.content);
                        if (message.senderType === 'user') {
                            userWords += wordCount;
                        }
                        else if (message.senderType === 'ai') {
                            characterWords += wordCount;
                        }
                    }
                }
            }
            wordStats[character.id] = {
                userWords,
                characterWords,
                totalWords: userWords + characterWords,
                chatCount: conversations.length + oldChats.length
            };
        }
        console.log(`🔍 [DEBUG] Completed word stats calculation`);
        res.json({
            success: true,
            wordStats
        });
    }
    catch (error) {
        console.error('Error calculating all word stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate word statistics for all characters'
        });
    }
});
/**
 * Get user-specific word count statistics for a character
 * Requires authentication
 */
router.get('/user/:characterId', requireAuth, async (req, res) => {
    try {
        const { characterId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        let userWords = 0;
        let characterWords = 0;
        // Method 1: Check conversations collection with embedded messages
        const conversations = await ConversationModel.find({
            userId,
            characterId: parseInt(characterId)
        }).lean();
        for (const conversation of conversations) {
            if (conversation.messages && Array.isArray(conversation.messages)) {
                for (const message of conversation.messages) {
                    const wordCount = countWords(message.content);
                    if (message.senderType === 'user') {
                        userWords += wordCount;
                    }
                    else if (message.senderType === 'ai') {
                        characterWords += wordCount;
                    }
                }
            }
        }
        // Method 2: Also check separate messages collection
        // Get conversation IDs for this user and character
        const conversationIds = conversations.map(conv => conv._id);
        if (conversationIds.length > 0) {
            const separateMessages = await MessageModel.find({
                conversationId: { $in: conversationIds }
            }).lean();
            for (const message of separateMessages) {
                const wordCount = countWords(message.content);
                if (message.sender === 'user') {
                    userWords += wordCount;
                }
                else if (message.sender === 'ai') {
                    characterWords += wordCount;
                }
            }
        }
        res.json({
            success: true,
            userWords,
            characterWords,
            totalWords: userWords + characterWords,
            chatCount: conversations.length
        });
    }
    catch (error) {
        console.error('Error calculating user word stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate user word statistics'
        });
    }
});
/**
 * Update all characters' chatCount field with their total word count
 * This endpoint will calculate word counts and update the chatCount field in the characters collection
 */
router.post('/update-chat-counts', async (req, res) => {
    try {
        const result = await updateAllCharacterWordCounts();
        res.json({
            success: true,
            message: `Updated ${result.updatedCount} characters with word counts`,
            updatedCount: result.updatedCount,
            totalCharacters: result.totalCharacters
        });
    }
    catch (error) {
        console.error('❌ Error updating chat counts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update chat counts'
        });
    }
});
/**
 * Update a specific character's chatCount field with their total word count
 */
router.post('/update-chat-count/:characterId', async (req, res) => {
    try {
        const { characterId } = req.params;
        const totalWords = await updateCharacterWordCount(parseInt(characterId));
        res.json({
            success: true,
            characterId: parseInt(characterId),
            totalWords,
            message: `Updated character ${characterId} with ${totalWords} words`
        });
    }
    catch (error) {
        console.error(`❌ Error updating chat count for character ${req.params.characterId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to update character chat count'
        });
    }
});
export default router;
