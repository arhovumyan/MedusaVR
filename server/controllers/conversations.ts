import { Request, Response } from "express";
import { ConversationModel } from "../db/models/ConversationModel.js";
import { CharacterModel } from "../db/models/CharacterModel.js";

export async function getConversation(req: Request, res: Response) {
  try {
    const { characterId: publicCharacterId } = req.params;
    // @ts-ignore
    const userId = req.user.id;

    console.log(`[getConversation] Searching for conversation with userId: ${userId} and publicCharacterId: ${publicCharacterId}`);

    const character = await CharacterModel.findOne({ id: publicCharacterId }).lean();
    if (!character) {
      console.log(`[getConversation] Character not found for public id: ${publicCharacterId}`);
      return res.status(404).json({ message: "Character not found" });
    }

    console.log(`[getConversation] Found character with _id: ${character._id}`);

    // Use the numeric character ID (publicCharacterId) to match the ConversationModel schema
    const conversation = await ConversationModel.findOne({
      userId,
      characterId: publicCharacterId, // Use the public character ID instead of MongoDB _id
    }).lean();

    if (conversation) {
      console.log(`[getConversation] Found conversation with ${conversation.messages.length} messages.`);
      res.json(conversation.messages);
    } else {
      console.log(`[getConversation] No conversation found.`);
      res.json([]);
    }
  } catch (err) {
    console.error("[getConversation] Error:", err);
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
}

export async function getUserConversations(req: Request, res: Response) {
  try {
    // @ts-ignore
    const userId = req.user.id;

    console.log(`[getUserConversations] Fetching conversations for userId: ${userId}`);

    const conversations = await ConversationModel.find({ userId })
      .sort({ 'messages.timestamp': -1 }) // Sort by the timestamp of the last message
      .lean();

    const formattedConversations = await Promise.all(conversations.map(async conv => {
      const lastMessage = conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;
      
      try {
        // Handle both numeric and ObjectId characterId values for backward compatibility
        let characterQuery: any;
        
        if (typeof conv.characterId === 'number') {
          // If it's already a number, use it directly
          characterQuery = { id: conv.characterId };
        } else if (typeof conv.characterId === 'string') {
          // If it's a string, try to parse it as a number
          const numericId = parseInt(conv.characterId);
          if (!isNaN(numericId)) {
            characterQuery = { id: numericId };
          } else {
            // If it's not a valid number string, skip this conversation
            console.warn(`[getUserConversations] Invalid characterId format: ${conv.characterId}`);
            return null;
          }
        } else {
          // If it's an ObjectId or other type, skip this conversation
          console.warn(`[getUserConversations] Unsupported characterId type: ${typeof conv.characterId}, value: ${conv.characterId}`);
          return null;
        }

        // Find the character using the numeric characterId
        const character = await CharacterModel.findOne(characterQuery).lean();

        // Skip conversations where the character has been deleted
        if (!character) {
          console.warn(`[getUserConversations] Character not found for characterId: ${conv.characterId}`);
          return null;
        }

        return {
          id: conv._id,
          characterId: character.id, // Public character ID
          name: character.name,
          avatarUrl: character.avatar,
          snippet: lastMessage ? lastMessage.content : "No messages yet.",
          lastTime: lastMessage ? lastMessage.timestamp : new Date(),
          unreadCount: 0, // Assuming no unread count tracking for now
        };
      } catch (charError) {
        console.error(`[getUserConversations] Error processing conversation ${conv._id}:`, charError);
        return null;
      }
    }));

    // Filter out null entries (deleted characters or invalid data)
    const validConversations = formattedConversations.filter(Boolean);

    console.log(`[getUserConversations] Returning ${validConversations.length} valid conversations`);
    res.json(validConversations);
  } catch (err) {
    console.error("[getUserConversations] Error:", err);
    res.status(500).json({ message: "Failed to fetch user conversations" });
  }
}

export async function deleteConversation(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;
    // @ts-ignore
    const userId = req.user.id;

    console.log(`[deleteConversation] Attempting to delete conversation ${conversationId} for user ${userId}`);

    const result = await ConversationModel.findOneAndDelete({
      _id: conversationId,
      userId: userId,
    });

    if (!result) {
      console.log(`[deleteConversation] Conversation ${conversationId} not found or does not belong to user ${userId}`);
      return res.status(404).json({ message: "Conversation not found or unauthorized" });
    }

    console.log(`[deleteConversation] Conversation ${conversationId} deleted successfully.`);
    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (err) {
    console.error("[deleteConversation] Error:", err);
    res.status(500).json({ message: "Failed to delete conversation" });
  }
}
