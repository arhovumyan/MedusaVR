import { Router, Request } from "express";
import { ChatsModel } from "../db/models/ChatsModel.js";
import { CharacterModel } from "../db/models/CharacterModel.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { replicateService } from "../services/ReplicateService.js";
import { openRouterWithFallback } from "../utils/openRouterFallback.js";
import { createPersonalitySystemMessage, getPersonalityVariation, generatePersonalityPrompts } from "../utils/personalityPrompts.js";
import { ContentModerationService } from "../services/ContentModerationService.js";
import { AIResponseFilterService } from "../services/AIResponseFilterService.js";
import express from 'express';
import fetch from 'node-fetch';
import { UserModel } from '../db/models/UserModel.js'; // Import UserModel
import { updateCharacterWordCount } from '../utils/wordCountUtils.js';

// Extend Express Request type to include user property
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      uid: string;
      [key: string]: any;
    };
  }
}

const router = Router();

// Get all chats for a user
router.get("/user/:userId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user?.uid;

    // Ensure user can only access their own chats
    if (userId !== authenticatedUserId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const chats = await ChatsModel.find({ userId }).sort({ lastActivity: -1 });

    const enrichedChats = await Promise.all(
      chats.map(async (chat) => {
        const character = await CharacterModel.findOne({ id: chat.characterId }).lean();
        if (!character) return null; // Skip if character was deleted
        
        return {
          ...chat.toObject(),
          character: {
            id: character.id,
            name: character.name,
            avatar: character.avatar,
            tags: character.tagNames || []
          }
        };
      })
    );

    // Filter out null entries (deleted characters)
    const validChats = enrichedChats.filter(Boolean);
    res.json(validChats);
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// Chat message interface
export interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'ai';
  content: string;
  timestamp: Date;
  characterId?: string;
  characterName?: string;
}

// AI response function using Replicate
export const generateAIResponse = async (
  message: string, 
  characterName: string, 
  characterPersona?: string
): Promise<string> => {
  try {
    console.log(` Generating AI response for ${characterName}...`);
    
    // Use Replicate service to generate the response
    const response = await replicateService.generateResponse(
      message, 
      characterName, 
      characterPersona
    );
    
    return response;
  } catch (error) {
    console.error(' Error generating AI response:', error);
    
    // Fallback to a simple response if Replicate fails
    return `*${characterName} looks thoughtful* I'm having some trouble understanding right now. Could you try rephrasing that?`;
  }
};

// Get chat history
router.get("/:characterId", requireAuth, async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Find or create chat session
    let chat = await ChatsModel.findOne({ userId, characterId });
    
    if (!chat) {
      const character = await CharacterModel.findOne({ id: parseInt(characterId) });
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      // Create enhanced personality-based system message for greeting
      const greetingSystemMessage = createPersonalitySystemMessage(
        {
          name: character.name,
          description: character.description,
          tagNames: Object.values(character.selectedTags || {}).flat() as string[]
        },
        "new user", // placeholder username for greeting generation
        "Generate a first greeting message that introduces your character based on your description. Make it engaging, personality-driven, and true to your character's nature. Keep it to 2-3 sentences maximum."
      );

      console.log(` Generating first greeting for ${character.name}`);

      // Generate AI greeting based on character description
      let aiGreeting = "";
      try {
        const result = await openRouterWithFallback({
          model: "x-ai/grok-code-fast-1",
          messages: [
            { role: "system", content: greetingSystemMessage },
            { role: "user", content: "Please introduce yourself and greet me for the first time." }
          ],
          max_tokens: 200,
          temperature: 0.8,
          top_p: 0.9
        });

        if (result.success && result.data?.choices?.[0]?.message?.content) {
          const rawAIGreeting = result.data.choices[0].message.content.trim();
          
          // Filter AI response for safety
          const filterResult = AIResponseFilterService.filterAIResponse(rawAIGreeting, character.name);
          if (filterResult.violations.length > 0) {
            console.error(` AI GREETING FILTERED for ${character.name}:`, filterResult.violations);
          }
          
          aiGreeting = filterResult.filteredResponse;
          console.log(` Generated greeting for ${character.name}: ${aiGreeting.substring(0, 100)}...`);
        } else {
          console.error("Failed to generate greeting:", result.error);
          // Fallback greeting based on character description
          aiGreeting = `*${character.description.split('.')[0]}* Hello there! I'm ${character.name}. It's wonderful to meet you!`;
        }
      } catch (error) {
        console.error("Error generating greeting:", error);
        // Fallback greeting
        aiGreeting = `Hello! I'm ${character.name}. ${character.description.split('.')[0]}. Nice to meet you!`;
      }

      chat = await ChatsModel.create({
        userId,
        characterId: parseInt(characterId),
        messages: [
          {
            role: "assistant",
            content: aiGreeting,
            timestamp: new Date()
          }
        ],
        lastActivity: new Date()
      });
      
      // Increment character's chat count when a new chat is started
      await CharacterModel.findOneAndUpdate(
        { id: parseInt(characterId) },
        { $inc: { chatCount: 1 } }
      );
    }

    res.json({
      chatId: chat._id,
      characterId: chat.characterId,
      messages: chat.messages || [],
      lastActivity: chat.lastActivity
    });

  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// Send message (REST endpoint for fallback)
router.post("/:characterId/message", requireAuth, ContentModerationService.moderateChatMessage, async (req, res) => {
  try {
    const { characterId } = req.params;
    const { content } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Find character
    const character = await CharacterModel.findOne({ id: parseInt(characterId) });
    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    // Find or create chat
    let chat = await ChatsModel.findOne({ userId, characterId: parseInt(characterId) });
    if (!chat) {
      chat = await ChatsModel.create({
        userId,
        characterId: parseInt(characterId),
        messages: [],
        lastActivity: new Date()
      });
      
      // Increment character's chat count when a new chat is started
      await CharacterModel.findOneAndUpdate(
        { id: parseInt(characterId) },
        { $inc: { chatCount: 1 } }
      );
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: userId,
      senderType: 'user',
      content,
      timestamp: new Date(),
    };

    // Generate AI response using personality system
    const user = await UserModel.findById(userId);
    const username = user?.username || "User";

    // Extract tag names from character's selectedTags, ensuring string[] type
    const tagNames: string[] = character.selectedTags
      ? (Object.values(character.selectedTags) as unknown as Array<unknown[]>)
          .flat()
          .filter((t): t is string => typeof t === 'string' && t.length > 0)
      : [];

    // Create enhanced personality-based system message
    const systemMessage = createPersonalitySystemMessage(
      {
        name: typeof character.name === 'string' ? character.name : '',
        description: typeof character.description === 'string' ? character.description : '',
        tagNames: tagNames,
        personalityTraits: character.personalityTraits,
        nsfw: character.nsfw || false,
        selectedTags: character.selectedTags
      },
      username,
      process.env.AI_BEHAVIOR_PROMPT
    );

    // Add personality variation for uniqueness
    const personalityVariation = getPersonalityVariation(tagNames);
    const enhancedSystemMessage = `${systemMessage} ${personalityVariation}`;

    console.log(" Character personality tags:", tagNames);
    console.log(" System message preview:", systemMessage.substring(0, 100) + '...');
    console.log(" Username being sent to AI:", username);

    // Use OpenRouter with fallback system for personality-based response
    const result = await openRouterWithFallback({
      model: "x-ai/grok-code-fast-1",
      messages: [
        { role: "system", content: enhancedSystemMessage },
        { role: "user", content: content }
      ],
      max_tokens: 350,
      temperature: 0.8,
      top_p: 0.9,
    });

    let aiResponse: string;
    if (result.success) {
      console.log(` OpenRouter response successful using model: ${result.modelUsed}`);
      const rawAIResponse = result.data.choices[0].message.content.trim();
      
      // Filter AI response for safety
      const filterResult = AIResponseFilterService.filterAIResponse(rawAIResponse, character.name);
      if (filterResult.violations.length > 0) {
        console.error(` AI RESPONSE FILTERED for ${character.name}:`, filterResult.violations);
      }
      
      aiResponse = filterResult.filteredResponse;
    } else {
      console.error(' OpenRouter failed, using fallback response:', result.error);
      aiResponse = `*${character.name} looks thoughtful* I'm having some trouble understanding right now. Could you try rephrasing that?`;
    }
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      senderId: character.id.toString(),
      senderType: 'ai',
      content: aiResponse,
      timestamp: new Date(),
      characterId: character.id.toString(),
      characterName: typeof character.name === 'string' ? character.name : undefined,
    };

    // Update chat with both messages
    chat.messages.push(userMessage as any);
    chat.messages.push(aiMessage as any);
    chat.lastActivity = new Date();
    await chat.save();

    // Update character's word count in chatCount field (background operation)
    updateCharacterWordCount(parseInt(characterId)).catch(error => {
      console.error(`Error updating word count for character ${characterId}:`, error);
    });

    res.json({
      userMessage,
      aiMessage,
      chatId: chat._id
    });

  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.post('/generate', requireAuth, ContentModerationService.moderateChatMessage, async (req, res) => { // Added requireAuth and content moderation
  const { messages, character } = req.body;
  const userId = req.user?.uid; // Get userId from authenticated request

  try {
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const user = await UserModel.findById(userId);
    const username = user?.username || "User"; // Get username, default to "User"

    // Create enhanced personality-based system message
    const systemMessage = createPersonalitySystemMessage(
      {
        name: character.name,
        description: character.description,
        tagNames: character.tagNames || [],
        personalityTraits: character.personalityTraits,
        nsfw: character.nsfw || false,
        selectedTags: character.selectedTags
      },
      username,
      process.env.AI_BEHAVIOR_PROMPT
    );

    // Add personality variation for uniqueness
    const personalityVariation = getPersonalityVariation(character.tagNames || []);
    const enhancedSystemMessage = `${systemMessage} ${personalityVariation}.`;

    console.log("Username being sent to AI:", username);
    console.log("Full enhanced system message being sent to AI:", enhancedSystemMessage);

    // Use OpenRouter with fallback system
    const result = await openRouterWithFallback({
      model: "x-ai/grok-code-fast-1", // Primary model (will be overridden by fallback if needed)
      messages: [
        { role: "system", content: enhancedSystemMessage },
        ...messages
      ],
      max_tokens: 350, // Increased for more detailed responses
      temperature: 0.8, // Slightly more creative
      top_p: 0.9, // Good balance of quality and creativity
    });

    if (result.success) {
      console.log(` OpenRouter response successful using model: ${result.modelUsed}`);
      
      // Filter AI response for safety before sending
      if (result.data?.choices?.[0]?.message?.content) {
        const rawAIResponse = result.data.choices[0].message.content;
        const filterResult = AIResponseFilterService.filterAIResponse(rawAIResponse, character.name);
        
        if (filterResult.violations.length > 0) {
          console.error(` AI RESPONSE FILTERED for ${character.name}:`, filterResult.violations);
        }
        
        // Update the response with filtered content
        result.data.choices[0].message.content = filterResult.filteredResponse;
      }
      
      res.json(result.data);
    } else {
      console.error(' All OpenRouter models failed:', result.error);
      res.status(500).json({ error: 'Failed to get response from OpenRouter - all models unavailable' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get response from OpenRouter' });
  }
});

// Note: WebSocket handling is now done via Socket.IO in app.ts
// This REST endpoint serves as a fallback for when WebSocket is not available

export default router;