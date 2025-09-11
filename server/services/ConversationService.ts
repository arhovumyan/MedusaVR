import { Conversation, IConversation } from "../db/models/ConversationModel.js";
import { Message, IMessage } from "../db/models/MessageModel.js";
import { Character, ICharacter } from "../db/models/CharacterModel.js";
import { Chat, IChat } from "../db/models/ChatsModel.js";
import { updateCharacterWordCount } from '../utils/wordCountUtils.js';

export class ConversationService {
  /**
   * Get or create a conversation between a user and character
   * This helps transition from the old direct chat system
   */
  static async getOrCreateConversation(userId: string, characterId: number): Promise<IConversation> {
    try {
      // Try to find existing conversation
      let conversation = await Conversation.findOne({
        userId,
        characterId
      }).sort({ lastActivity: -1 });

      // If no conversation exists, create one
      if (!conversation) {
        const character = await Character.findOne({ id: characterId });
        if (!character) {
          throw new Error('Character not found');
        }

        conversation = await Conversation.create({
          userId,
          characterId,
          title: `Chat with ${character.name}`
        });
        
        // Increment character's chat count when a new conversation is started
        await Character.findOneAndUpdate(
          { id: characterId },
          { $inc: { chatCount: 1 } }
        );
      }

      return conversation;
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      throw error;
    }
  }

  /**
   * Create a new conversation (allows multiple conversations with same character)
   */
  static async createNewConversation(userId: string, characterId: number): Promise<IConversation> {
    try {
      const character = await Character.findOne({ id: characterId });
      if (!character) {
        throw new Error('Character not found');
      }

      const conversation = await Conversation.create({
        userId,
        characterId,
        title: `Chat with ${character.name}`
      });
      
      // Increment character's chat count when a new conversation is started
      await Character.findOneAndUpdate(
        { id: characterId },
        { $inc: { chatCount: 1 } }
      );

      return conversation;
    } catch (error) {
      console.error('Error creating new conversation:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string, options: {
    page?: number;
    limit?: number;
    archived?: boolean;
  } = {}): Promise<{ conversations: IConversation[], pagination: { page: number, limit: number, total: number } }> {
    try {
      const { page = 1, limit = 20, archived = false } = options;

      const conversations = await Conversation
        .find({ 
          userId, 
          isArchived: archived 
        })
        .sort({ lastActivity: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

      // Enrich with character information
      const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const character = await Character.findOne({ id: conv.characterId }).lean();
          return {
            ...conv,
            characterName: character?.name || 'Unknown',
            characterAvatar: character?.avatar || '',
          };
        })
      );

      return {
        conversations: enrichedConversations,
        pagination: {
          page,
          limit,
          total: await Conversation.countDocuments({ userId, isArchived: archived })
        }
      };
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getConversationMessages(conversationId: string, userId: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ messages: IMessage[], conversationInfo: IConversation, pagination: { page: number, limit: number, total: number } }> {
    try {
      const { page = 1, limit = 50 } = options;

      // Verify conversation belongs to user
      const conversation = await Conversation.findOne({
        _id: conversationId,
        userId
      });

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      const messages = await Message
        .find({ conversationId })
        .sort({ timestamp: 1 }) // Oldest first
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

      return {
        messages,
        conversationInfo: conversation,
        pagination: {
          page,
          limit,
          total: await Message.countDocuments({ conversationId })
        }
      };
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  /**
   * Send a message in a conversation
   */
  static async sendMessage(conversationId: string, userId: string, content: string, sender: 'user' | 'ai', options: {
    characterId?: number;
    characterName?: string;
    imageUrl?: string;
    imagePrompt?: string;
  } = {}): Promise<IMessage> {
    try {
      // Verify conversation belongs to user
      const conversation = await Conversation.findOne({
        _id: conversationId,
        userId
      });

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      // Create message data
      const messageData: Partial<IMessage> = {
        conversationId: conversation._id,
        sender,
        content: content.trim()
      };

      // Add character info for AI messages
      if (sender === 'ai' && options.characterId && options.characterName) {
        messageData.characterId = options.characterId;
        messageData.characterName = options.characterName;
      }

      // Add image fields if provided
      if (options.imageUrl) {
        messageData.imageUrl = options.imageUrl;
      }
      if (options.imagePrompt) {
        messageData.imagePrompt = options.imagePrompt;
      }

      // Create message
      const message = await Message.create(messageData);

      // Update conversation metadata
      await Conversation.updateOne(
        { _id: conversationId },
        {
          $set: {
            lastMessage: content.trim().substring(0, 100),
            lastActivity: new Date()
          },
          $inc: { messageCount: 1 }
        }
      );

      // Update character's word count in chatCount field (background operation)
      if (options.characterId) {
        updateCharacterWordCount(options.characterId).catch(error => {
          console.error(`Error updating word count for character ${options.characterId}:`, error);
        });
      }

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Migrate old chat data to new conversation system
   * This is a one-time migration helper
   */
  static async migrateOldChats(): Promise<void> {
    try {
      console.log('🔄 Starting migration from old chat system to conversations...');

      const oldChats = await Chat.find({}).lean();
      let migratedCount = 0;

      for (const chat of oldChats) {
        try {
          // Get or create conversation
          const conversation = await this.getOrCreateConversation(
            chat.userId,
            chat.characterId
          );

          // Migrate messages
          for (const message of chat.messages || []) {
            await Message.create({
              conversationId: conversation._id,
              sender: message.senderType,
              content: message.content,
              timestamp: message.timestamp,
              messageId: message.id,
              characterId: message.characterId ? parseInt(message.characterId) : undefined,
              characterName: message.characterName
            });
          }

          // Update conversation metadata
          await Conversation.updateOne(
            { _id: conversation._id },
            {
              $set: {
                lastMessage: chat.lastMessage || '',
                lastActivity: chat.lastActivity || new Date(),
                messageCount: chat.messages?.length || 0
              }
            }
          );

          migratedCount++;
        } catch (error) {
          console.error(`Error migrating chat for user ${chat.userId}, character ${chat.characterId}:`, error);
        }
      }

      console.log(`✅ Migration completed. Migrated ${migratedCount} chats.`);
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  }
}