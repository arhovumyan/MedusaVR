/**
 * Utility functions for word counting and character chatCount updates
 */

import { CharacterModel } from '../db/models/CharacterModel.js';
import { ConversationModel } from '../db/models/ConversationModel.js';
import { MessageModel } from '../db/models/MessageModel.js';
import { ChatsModel } from '../db/models/ChatsModel.js';

/**
 * Helper function to count words in a text
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  
  // Remove extra whitespace and split by spaces
  // Filter out empty strings and count remaining words
  return text.trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(word => word.length > 0)
    .length;
}

/**
 * Update a character's chatCount field with total word count from all conversations
 * This should be called after new messages are added
 */
export async function updateCharacterWordCount(characterId: number): Promise<number> {
  try {
    let userWords = 0;
    let characterWords = 0;
    
    console.log(`🔄 Updating word count for character ${characterId}`);
    
    // Method 1: Check conversations collection with embedded messages
    const conversations = await ConversationModel.find({ 
      characterId 
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
    
    // Method 3: Check old chats collection
    const oldChats = await ChatsModel.find({ 
      characterId 
    }).lean();
    
    for (const chat of oldChats) {
      if (chat.messages && Array.isArray(chat.messages)) {
        for (const message of chat.messages) {
          const wordCount = countWords(message.content);
          
          if (message.senderType === 'user') {
            userWords += wordCount;
          } else if (message.senderType === 'ai') {
            characterWords += wordCount;
          }
        }
      }
    }
    
    const totalWords = userWords + characterWords;
    
    // Update the character's chatCount field with total word count
    await CharacterModel.updateOne(
      { id: characterId },
      { $set: { chatCount: totalWords } }
    );
    
    console.log(`✅ Updated character ${characterId} chatCount: ${totalWords} words (user: ${userWords}, ai: ${characterWords})`);
    
    return totalWords;
  } catch (error) {
    console.error(`❌ Error updating word count for character ${characterId}:`, error);
    return 0;
  }
}

/**
 * Update word counts for multiple characters
 */
export async function updateMultipleCharacterWordCounts(characterIds: number[]): Promise<void> {
  for (const characterId of characterIds) {
    await updateCharacterWordCount(characterId);
  }
}

/**
 * Batch update all characters' word counts
 * This is a heavy operation and should be used sparingly
 */
export async function updateAllCharacterWordCounts(): Promise<{ updatedCount: number, totalCharacters: number }> {
  try {
    console.log('🔄 [BATCH] Starting word count update for all characters...');
    
    const characters = await CharacterModel.find({}, 'id name').lean();
    let updatedCount = 0;
    
    for (const character of characters) {
      const totalWords = await updateCharacterWordCount(character.id);
      if (totalWords > 0) {
        updatedCount++;
      }
    }
    
    console.log(`🎉 [BATCH] Complete! Updated ${updatedCount}/${characters.length} characters with word counts`);
    
    return {
      updatedCount,
      totalCharacters: characters.length
    };
  } catch (error) {
    console.error('❌ Error in batch word count update:', error);
    throw error;
  }
}
