import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { ConversationModel } from '../db/models/ConversationModel.js';
import { MessageModel } from '../db/models/MessageModel.js';
import { ChatsModel } from '../db/models/ChatsModel.js';  // Add old chat model
import { CharacterModel } from '../db/models/CharacterModel.js';
import { countWords, updateCharacterWordCount, updateAllCharacterWordCounts } from '../utils/wordCountUtils.js';

const router = Router();

/**
 * Get word count statistics for a character (all users)
 * Returns: { userWords: number, characterWords: number, totalWords: number }
 */
router.get('/character/:characterId', async (req: Request, res: Response) => {
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
          } else if (message.senderType === 'ai') {
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
        } else if (message.sender === 'ai') {
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
          } else if (message.senderType === 'ai') {
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
    
  } catch (error) {
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
 * Optimized to prevent timeouts by using aggregation and limiting results
 */
router.get('/all-characters', async (req: Request, res: Response) => {
  try {
    // Set a reasonable timeout for this operation
    const timeout = setTimeout(() => {
      console.log('⚠️ Word stats calculation timeout - returning partial results');
      res.status(408).json({
        success: false,
        error: 'Request timeout - word stats calculation took too long',
        message: 'Please try again later or contact support if the issue persists'
      });
    }, 25000); // 25 second timeout

    // Get all characters with a limit to prevent overwhelming the system
    const characters = await CharacterModel.find({}, 'id name').limit(100);
    const wordStats: { [key: string]: any } = {};
    
    console.log(`🔍 [DEBUG] Processing ${characters.length} characters for word stats (limited to prevent timeout)`);
    
    // Process characters in batches to prevent memory issues
    const batchSize = 10;
    for (let i = 0; i < characters.length; i += batchSize) {
      const batch = characters.slice(i, i + batchSize);
      
      // Process batch in parallel with Promise.all
      const batchPromises = batch.map(async (character) => {
        try {
          let userWords = 0;
          let characterWords = 0;
          let chatCount = 0;
          
          // Use aggregation pipeline for better performance
          const conversationStats = await ConversationModel.aggregate([
            { $match: { characterId: character.id } },
            { $unwind: '$messages' },
            {
              $group: {
                _id: '$messages.senderType',
                totalWords: {
                  $sum: {
                    $size: {
                      $split: ['$messages.content', ' ']
                    }
                  }
                },
                count: { $sum: 1 }
              }
            }
          ]);
          
          // Process aggregation results
          for (const stat of conversationStats) {
            const wordCount = stat.totalWords || 0;
            if (stat._id === 'user') {
              userWords += wordCount;
            } else if (stat._id === 'ai') {
              characterWords += wordCount;
            }
          }
          
          // Get chat count
          const chatCountResult = await ConversationModel.countDocuments({ characterId: character.id });
          chatCount += chatCountResult;
          
          // Also check old chats collection (simplified)
          const oldChatCount = await ChatsModel.countDocuments({ characterId: character.id });
          chatCount += oldChatCount;
          
          return {
            characterId: character.id,
            stats: {
              userWords,
              characterWords,
              totalWords: userWords + characterWords,
              chatCount
            }
          };
        } catch (error) {
          console.error(`Error processing character ${character.id}:`, error);
          return {
            characterId: character.id,
            stats: {
              userWords: 0,
              characterWords: 0,
              totalWords: 0,
              chatCount: 0
            }
          };
        }
      });
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Add results to wordStats
      for (const result of batchResults) {
        wordStats[result.characterId] = result.stats;
      }
      
      // Small delay between batches to prevent overwhelming the database
      if (i + batchSize < characters.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    clearTimeout(timeout);
    console.log(`🔍 [DEBUG] Completed word stats calculation for ${Object.keys(wordStats).length} characters`);
    
    res.json({
      success: true,
      wordStats,
      totalCharacters: Object.keys(wordStats).length,
      note: 'Results may be limited to prevent timeouts'
    });
    
  } catch (error) {
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
router.get('/user/:characterId', requireAuth, async (req: Request, res: Response) => {
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
          } else if (message.senderType === 'ai') {
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
        } else if (message.sender === 'ai') {
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
    
  } catch (error) {
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
router.post('/update-chat-counts', async (req: Request, res: Response) => {
  try {
    const result = await updateAllCharacterWordCounts();
    
    res.json({
      success: true,
      message: `Updated ${result.updatedCount} characters with word counts`,
      updatedCount: result.updatedCount,
      totalCharacters: result.totalCharacters
    });
    
  } catch (error) {
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
router.post('/update-chat-count/:characterId', async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    const totalWords = await updateCharacterWordCount(parseInt(characterId));
    
    res.json({
      success: true,
      characterId: parseInt(characterId),
      totalWords,
      message: `Updated character ${characterId} with ${totalWords} words`
    });
    
  } catch (error) {
    console.error(`❌ Error updating chat count for character ${req.params.characterId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to update character chat count'
    });
  }
});

export default router;
