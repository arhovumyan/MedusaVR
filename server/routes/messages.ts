import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { ConversationService } from "../services/ConversationService.js";
import { ChatsModel } from "../db/models/ChatsModel.js";

const router = Router();

// Send a message in a conversation
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { 
      conversationId, 
      content, 
      sender = 'user',
      characterId,
      characterName,
      imageUrl,
      imagePrompt 
    } = req.body;

    if (!content) {
      return res.status(400).json({ error: "content is required" });
    }

    // Handle the temporary conversationId case by using the existing chat system
    if (conversationId === 'temp-conversation-id' && characterId) {
      // Use the existing chat system for image messages
      const chat = await ChatsModel.findOne({ 
        userId, 
        characterId: parseInt(characterId) 
      });

      if (chat) {
        // Add the image message to the existing chat
        const imageMessage = {
          id: Date.now().toString(),
          senderId: sender === 'user' ? userId : characterId.toString(),
          senderType: sender,
          content: content || `Generated image: ${imagePrompt || 'No prompt'}`,
          timestamp: new Date(),
          characterId: characterId.toString(),
          characterName: characterName,
          imageUrl: imageUrl,
          imagePrompt: imagePrompt
        };

        chat.messages.push(imageMessage as any);
        chat.lastMessage = `Generated image: ${imagePrompt || 'No prompt'}`;
        chat.lastActivity = new Date();
        await chat.save();

        return res.json({
          messageId: imageMessage.id,
          message: imageMessage
        });
      } else {
        return res.status(404).json({ error: "Chat not found" });
      }
    }

    // Original conversation system handling
    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required" });
    }

    // Send message using ConversationService
    const message = await ConversationService.sendMessage(
      conversationId, 
      userId, 
      content, 
      sender,
      { 
        characterId: characterId ? Number(characterId) : undefined,
        characterName,
        imageUrl,
        imagePrompt
      }
    );

    res.json({
      messageId: message._id,
      message
    });

  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get messages for a conversation
router.get("/:conversationId", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const result = await ConversationService.getConversationMessages(
      conversationId,
      userId,
      {
        page: Number(page),
        limit: Number(limit)
      }
    );

    res.json(result);

  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

export default router;
