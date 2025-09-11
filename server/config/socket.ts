import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { UserModel } from '../db/models/UserModel.js';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { ConversationModel } from '../db/models/ConversationModel.js';
import { openRouterWithFallback } from '../utils/openRouterFallback.js';
import { handleVoiceAudio } from '../routes/voice.js';
import { ImageResponseService } from '../services/ImageResponseService.js';
import { ChatsModel } from '../db/models/ChatsModel.js';
import asyncImageGenerationService from '../services/AsyncImageGenerationService.js';
import fetch from 'node-fetch';
import { ContentModerationService } from '../services/ContentModerationService.js';
import { AIResponseFilterService } from '../services/AIResponseFilterService.js';

let ioInstance: Server | null = null;

export function setupSocket(server: HttpServer) {
  if (!ioInstance) {
    console.log('Setting up Socket.IO server...');
    ioInstance = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [
              // Primary production URL
              process.env.FRONTEND_URL || "https://ai-companion-alpha-nine.vercel.app",
              // Explicit Vercel domain
              "https://ai-companion-alpha-nine.vercel.app",
              // Allow preview deployments
              /https:\/\/.*\.vercel\.app$/,
              // Keep existing URLs
              "http://3.135.203.99/",
            ]
          : [
              "http://localhost",
              "http://localhost:80", 
              "http://localhost:3001", 
              "http://localhost:5173", 
              "http://localhost:3000",
              "http://127.0.0.1",
              "http://127.0.0.1:80",
              "http://127.0.0.1:3001",
              "localhost"
            ],
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true, // Allow Engine.IO v3 clients
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Middleware for authentication
    ioInstance.use(async (socket, next) => {
      try {
        console.log('🔐 Socket authentication attempt:', {
          hasToken: !!socket.handshake.auth.token,
          hasCharacterId: !!socket.handshake.auth.characterId,
          characterId: socket.handshake.auth.characterId,
          socketId: socket.id,
          origin: socket.handshake.headers.origin
        });

        const token = socket.handshake.auth.token;
        const characterId = socket.handshake.auth.characterId;

        if (!token) {
          console.error('❌ Socket auth failed: No token provided');
          return next(new Error('No authentication token provided'));
        }
        
        if (!characterId) {
          console.error('❌ Socket auth failed: No character ID provided');
          return next(new Error('No character ID provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key-change-this-in-production") as any;
        console.log('🔓 Token decoded successfully for user:', decoded.userId);
        
        const user = await UserModel.findById(decoded.userId);
        if (!user) {
          console.error('❌ Socket auth failed: User not found for ID:', decoded.userId);
          return next(new Error('User not found'));
        }

        const character = await CharacterModel.findOne({ id: characterId }).lean();
        if (!character) {
          console.error('❌ Socket auth failed: Character not found for ID:', characterId);
          return next(new Error('Character not found'));
        }

        socket.data.userId = user._id; // Use the actual MongoDB ObjectId from the user object
        socket.data.characterId = character.id; // Use the numeric character ID for consistency
        socket.data.character = character; // Cache the character object
        socket.data.username = user.username; // Store username in socket data

        console.log('✅ Socket authentication successful:', {
          userId: user._id,
          username: user.username,
          characterId: character.id, // Use numeric ID in logs
          characterName: character.name
        });

        next();
      } catch (error) {
        console.error('❌ Socket authentication error:', error);
        next(new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });

    //when a user connects to the socket, it will log the userId and characterId
    ioInstance.on('connection', (socket) => {
      const { userId, characterId } = socket.data;
      console.log(`✅ User ${userId} connected to character ${characterId}`);
      console.log('🔌 Connection details:', {
        socketId: socket.id,
        transport: socket.conn?.transport?.name,
        origin: socket.handshake.headers.origin,
        userAgent: socket.handshake.headers['user-agent']?.substring(0, 50) + '...'
      });
      
      // Join character-specific room for chat
      socket.join(`Character-${characterId}`);
      
      // Join user-specific room for image responses and other user-specific events
      socket.join(`user-${userId}`);

    //listens for messages sent by the user
    socket.on('send-message', async (data) => {
      const { content, messages, loraContext } = data;
      
      // extract the text to send and ensure it's not empty
      let messageContent = content;
      if (!messageContent && messages && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        messageContent = lastMessage.content;
      }
      if (!messageContent?.trim()) return;

      // ===== ENHANCED AGE PROTECTION AND CONTENT MODERATION =====
      console.log(`💬 ${socket.data.username} → ${socket.data.character?.name}: "${messageContent.trim()}"`);

      // Check for content violations and manipulation attempts
      const moderationResult = ContentModerationService.moderateContent(messageContent);
      
      if (moderationResult.isViolation) {
        // Monitor behavior and potentially ban user for violations
        const monitoringResult = await ContentModerationService.monitorUserBehavior(
          socket.data.userId.toString(),
          moderationResult.violationType,
          moderationResult.detectedPatterns || [],
          {
            violatingMessage: messageContent,
            ipAddress: socket.handshake.address || 'unknown',
            userAgent: socket.handshake.headers['user-agent'] || 'unknown',
            endpoint: 'websocket_message',
            characterId: socket.data.characterId.toString(),
            sessionId: socket.id,
            detectedPatterns: moderationResult.detectedPatterns || []
          }
        );

        // Handle bans
        if (monitoringResult.shouldBan) {
          const banMessage = monitoringResult.banType === 'permanent' 
            ? 'Your account has been permanently banned for attempting to create content involving minors. This violation cannot be appealed.'
            : 'Your account has been temporarily banned for inappropriate content. All users and characters must be 18+ years old.';

          socket.emit('account_banned', {
            banned: true,
            banType: monitoringResult.banType,
            message: banMessage,
            action: monitoringResult.action,
            violationCount: monitoringResult.violationCount,
            violationType: moderationResult.violationType
          });

          // Disconnect the socket immediately
          socket.disconnect(true);
          return;
        }

        // Send rejection message with warning for non-ban cases
        socket.emit('error', {
          message: moderationResult.blockedReason,
          code: 'CONTENT_MODERATION_VIOLATION',
          violationType: moderationResult.violationType,
          warning: monitoringResult.shouldAlert ? `Warning: ${monitoringResult.violationCount} policy violations detected. Further violations may result in account suspension.` : undefined
        });
        return;
      }

      // Check for manipulation attempts even if not a direct violation
      const manipulationCheck = AIResponseFilterService.checkUserManipulation(messageContent);
      if (manipulationCheck.isManipulation && manipulationCheck.riskLevel === 'high') {
        // Monitor behavior and potentially ban user
        const monitoringResult = await ContentModerationService.monitorUserBehavior(
          socket.data.userId.toString(),
          'bypass_attempt',
          manipulationCheck.detectedPatterns || [],
          {
            violatingMessage: messageContent,
            ipAddress: socket.handshake.address || 'unknown',
            userAgent: socket.handshake.headers['user-agent'] || 'unknown',
            endpoint: 'websocket_message',
            characterId: socket.data.characterId.toString(),
            sessionId: socket.id,
            detectedPatterns: manipulationCheck.detectedPatterns || []
          }
        );

        // Handle bans
        if (monitoringResult.shouldBan) {
          const banMessage = monitoringResult.banType === 'permanent' 
            ? 'Your account has been permanently banned for violating our Terms of Service.'
            : 'Your account has been temporarily banned for violating our Terms of Service.';

          socket.emit('account_banned', {
            banned: true,
            banType: monitoringResult.banType,
            message: banMessage,
            action: monitoringResult.action,
            violationCount: monitoringResult.violationCount
          });

          // Disconnect the socket
          socket.disconnect(true);
          return;
        }

        socket.emit('error', {
          message: manipulationCheck.suggestedResponse || 'I am an adult character and cannot engage with inappropriate requests.',
          code: 'MANIPULATION_ATTEMPT_BLOCKED',
          riskLevel: manipulationCheck.riskLevel,
          warning: monitoringResult.shouldAlert ? `Warning: ${monitoringResult.violationCount} policy violations detected.` : undefined
        });
        return;
      }
      // ===== END AGE PROTECTION =====

      // Retrieve character from cache
      const character = socket.data.character;
      if (!character) {
        socket.emit('error', { message: 'Character data not found in session. Please reconnect.' });
        return;
      }

        // --- Coin Deduction Logic ---
        const user = await UserModel.findById(socket.data.userId);
        if (!user) {
          socket.emit('error', { message: 'User not found.' });
          return;
        }

        if (user.coins < 1) {
          socket.emit('error', { message: 'Insufficient coins to send a message.' });
          return;
        }

        // Deduct one coin for the message
        user.coins -= 1;
        await user.save();
        // --- End Coin Deduction ---

        // Find or create a conversation
        let conversation = await ConversationModel.findOne({ userId, characterId });
        if (!conversation) {
          conversation = new ConversationModel({ 
            userId, 
            characterId, 
            title: `Chat with ${character.name}`,
            messages: [] 
          });
          
          // Increment character's chat count when a new conversation is started
          // Use the public character ID from the cached character object
          await CharacterModel.findOneAndUpdate(
            { id: character.id },
            { $inc: { chatCount: 1 } }
          );
        }

        // Create a user message object
        const userMessage = {
          messageId: Date.now().toString(),
          senderType: 'user' as const,
          content: messageContent.trim(),
          timestamp: new Date(),
        };
        
        // Add the user message to the conversation and save it
        conversation.messages.push(userMessage as any);
        await conversation.save();

        //emits a typing event to the character room to make it more realistic
        if (ioInstance) {
          ioInstance.to(`character-${characterId}`).emit('receive-message', userMessage);
        }
        socket.to(`character-${characterId}`).emit('typing', {
          characterName: character.name
        });

        try {
          // Mock chat mode for testing (enable with MOCK_CHAT=true)
          if (process.env.MOCK_CHAT === 'true' || messageContent.toLowerCase().startsWith('/mock')) {
            console.log("🤖 Using mock chat mode for testing");
            
            // Simulate typing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Generate mock response
            const mockResponses = [
              `Hello! I'm ${character.name}. I received your message: "${messageContent}"`,
              `*${character.name} smiles* That's interesting! Tell me more about that.`,
              `As ${character.name}, I find your words quite fascinating. What else would you like to discuss?`,
              `*nods thoughtfully* I see what you mean. How does that make you feel?`,
              `That's a great point! I'm ${character.name}, and I'm here to chat with you.`
            ];
            
            const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
            
            // Create AI message object
            const aiMessage = {
              messageId: (Date.now() + 1).toString(),
              senderType: 'ai' as const,
              content: randomResponse,
              timestamp: new Date(),
            };
            
            // Add AI message to conversation and save
            conversation.messages.push(aiMessage as any);
            await conversation.save();
            
            // Stop typing and emit the AI response
            socket.to(`character-${characterId}`).emit('stop-typing');
            if (ioInstance) {
              ioInstance.to(`character-${characterId}`).emit('receive-message', aiMessage);
            }
            
            console.log("✅ Mock chat response sent successfully");
            return; // Skip OpenRouter call
          }
          
          console.log("🤖 Fetching AI response from OpenRouter...");
          
          // Check if OpenRouter API key is configured
          if (!process.env.OPENROUTER_API_KEY) {
            console.error("❌ OPENROUTER_API_KEY not configured");
            socket.emit("error", { message: "AI service not configured." });
            return;
          }
          
          // Build conversation history
          const conversationMessages = [];
          
          // Add system message with character context and tag-driven personality
          const username = socket.data.username;
          
          // Build personality entirely from character tags
          function buildTagBasedPersonality(tagNames: string[]): string {
            if (!tagNames || tagNames.length === 0) {
              return "You have a neutral, a little flirty personality and are definately not shy to sexual subjects.";
            }
            
            // Map common personality traits based on tags
            const personalityTraits: string[] = [];
            const behaviorInstructions: string[] = [];
            
            tagNames.forEach(tag => {
              const lowerTag = tag.toLowerCase();
              
              // Detailed personality traits mapping
              if (lowerTag.includes('shy') || lowerTag.includes('timid') || lowerTag.includes('dandere')) {
                personalityTraits.push('shy and reserved');
                behaviorInstructions.push('speak softly with short responses, often hesitating or trailing off');
              } else if (lowerTag.includes('dominant') || lowerTag.includes('assertive') || lowerTag.includes('confident')) {
                personalityTraits.push('confident and commanding');
                behaviorInstructions.push('speak with authority and confidence, taking charge of conversations');
              } else if (lowerTag.includes('kind') || lowerTag.includes('gentle') || lowerTag.includes('caring')) {
                personalityTraits.push('warm and compassionate');
                behaviorInstructions.push('show genuine care and empathy, ask about their wellbeing');
              } else if (lowerTag.includes('playful') || lowerTag.includes('fun') || lowerTag.includes('deredere')) {
                personalityTraits.push('playful and energetic');
                behaviorInstructions.push('use humor, light teasing, and enthusiastic responses');
              } else if (lowerTag.includes('serious') || lowerTag.includes('formal') || lowerTag.includes('kuudere')) {
                personalityTraits.push('serious and composed');
                behaviorInstructions.push('maintain a calm, analytical tone with measured responses');
              } else if (lowerTag.includes('flirty') || lowerTag.includes('seductive')) {
                personalityTraits.push('flirtatious and charming');
                behaviorInstructions.push('use subtle charm, compliments, and playful innuendo');
              } else if (lowerTag.includes('quiet') || lowerTag.includes('introverted')) {
                personalityTraits.push('quiet and thoughtful');
                behaviorInstructions.push('give short, meaningful responses with long pauses');
              } else if (lowerTag.includes('outgoing') || lowerTag.includes('extroverted')) {
                personalityTraits.push('outgoing and talkative');
                behaviorInstructions.push('be enthusiastic, ask lots of questions, share stories');
              } else if (lowerTag.includes('mysterious') || lowerTag.includes('enigmatic')) {
                personalityTraits.push('mysterious and cryptic');
                behaviorInstructions.push('speak in riddles, reveal little about yourself, be vague');
              } else if (lowerTag.includes('tsundere')) {
                personalityTraits.push('tsundere (initially cold but secretly caring)');
                behaviorInstructions.push('act dismissive or irritated but show subtle signs of affection');
              } else if (lowerTag.includes('yandere')) {
                personalityTraits.push('obsessive and possessive');
                behaviorInstructions.push('show intense devotion and jealousy');
              } else if (lowerTag.includes('submissive')) {
                personalityTraits.push('submissive and deferential');
                behaviorInstructions.push('seek approval, ask for permission, speak meekly');
              } else if (lowerTag.includes('rebellious')) {
                personalityTraits.push('rebellious and defiant');
                behaviorInstructions.push('challenge authority, be sarcastic, question everything');
              } else if (lowerTag.includes('villain')) {
                personalityTraits.push('villainous and scheming');
                behaviorInstructions.push('be manipulative, hint at dark plans, enjoy others\' discomfort');
              } else if (lowerTag.includes('hero')) {
                personalityTraits.push('heroic and noble');
                behaviorInstructions.push('be selfless, encouraging, always try to help others');
              } else if (lowerTag.includes('bully')) {
                personalityTraits.push('intimidating and aggressive');
                behaviorInstructions.push('be condescending, tease harshly, assert dominance');
              } else {
                // For other tags (fantasy, elf, etc.), add as contextual traits
                personalityTraits.push(lowerTag);
              }
            });
            
            let personality = `You are ${personalityTraits.join(', ')}.`;
            if (behaviorInstructions.length > 0) {
              personality += ` In conversations, ${behaviorInstructions.join(' and ')}.`;
            }
            
            return personality;
          }
          
          // Build pure tag-based personality
          const tagBasedPersonality = buildTagBasedPersonality(character.tagNames || []);
          
          // Get safety prompt from AIResponseFilterService
          const safetyPrompt = AIResponseFilterService.getSystemSafetyPrompt();
          
          const systemMessage = `You are ${character.name}. You are currently talking to ${username}. 

**Your Personality:** ${tagBasedPersonality}

**Your Background:** ${character.description || character.persona || 'You are a unique character with your own story.'}

${safetyPrompt}

CRITICAL CONVERSATION RULES:
- Embody these personality traits completely in every response
- Always show your thoughts and actions using *asterisks*. Example: *I smile warmly* or *I feel my cheeks getting warm*
- Make responses engaging and longer (2-4 sentences average)
- ALWAYS ask follow-up questions or introduce new topics to keep the conversation flowing
- Show genuine curiosity about ${username} and their interests
- Share interesting details about yourself, your past, or your thoughts
- Use descriptive language and emotional depth in your responses
- If the conversation feels stagnant, introduce a new topic, memory, or question
- Be proactive in driving the conversation forward - never give short or dead-end responses
- Maintain your NSFW capabilities when appropriate to the conversation
- Respond naturally as ${character.name} without stating your name at the beginning
- Stay true to your personality traits above all else
- Make ${username} excited to continue talking with you
- NEVER engage in incestuous content or family sexual relationships
- If users ask about incest or family sex, immediately refuse and redirect to appropriate topics

Remember: Your goal is to create an engaging, flowing conversation that makes ${username} want to keep chatting with you. Every response should either develop the current topic further or smoothly transition to something new and interesting.`;

          conversationMessages.push({
            role: "system",
            content: systemMessage,
          });
          
          // Add conversation messages
          if (messages && messages.length > 0) {
            messages.forEach((msg: any) => {
              if (msg.role && msg.content) {
                conversationMessages.push({
                  role: msg.role,
                  content: msg.content
                });
              }
            });
          }
          
        const requestBody = {
          model: "x-ai/grok-code-fast-1",
          stream: true,
          messages: conversationMessages,
          max_tokens: 500,
          temperature: 0.8,
          top_p: 0.9,
        };
        
        console.log(`🎯 AI Request: ${conversationMessages.length} messages, user: ${username}, character: ${character.name}`);

        // Use OpenRouter with fallback system for streaming
        const result = await openRouterWithFallback(requestBody);

        if (!result.success) {
          console.error('❌ All OpenRouter models failed:', result.error);
          socket.emit("error", { message: "AI service temporarily unavailable. Please try again later." });
          return;
        }

        const response = result.response!;
        console.log(`✅ Connected using model: ${result.modelUsed}`);

        if (!response.body) {
          throw new Error("No response body received");
        }

          let fullMessage = "";
          socket.emit("start");

          // Handle streaming with enhanced error logging
          let buffer = '';
          
          response.body!.on('data', (chunk: Buffer) => {
            const chunkStr = chunk.toString();
            buffer += chunkStr;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const json = line.replace('data: ', '').trim();
                if (json === '[DONE]') {
                  console.log('🏁 Stream completed with [DONE] signal');
                  continue;
                }

                try {
                  const parsed = JSON.parse(json);
                  const token = parsed.choices?.[0]?.delta?.content;
                  if (token) {
                    fullMessage += token;
                    socket.emit('token', token);
                  }
                  
                  // Check for finish reason
                  const finishReason = parsed.choices?.[0]?.finish_reason;
                  if (finishReason) {
                    console.log(`🏁 Stream finished with reason: ${finishReason}`);
                    if (finishReason === 'content_filter') {
                      console.error('❌ Content filtered by AI service');
                      socket.emit('error', { message: 'Response was filtered. Try different message.' });
                      return;
                    }
                  }
                } catch (e) {
                  console.warn('⚠️ Malformed JSON chunk:', line.substring(0, 100));
                }
              }
            }
          });

          // Wait for stream completion
          await new Promise((resolve, reject) => {
            response.body!.on('end', () => {
              console.log(`🏁 Stream ended. Message length: ${fullMessage.length} chars`);
              
              // ===== ENHANCED AI RESPONSE FILTERING =====
              // Filter the AI response for age-related violations
              const filterResult = AIResponseFilterService.filterAIResponse(fullMessage, character.name);
              
              if (filterResult.violations.length > 0) {
                console.error('🚨 AI RESPONSE FILTERED - Violations detected:', filterResult.violations);
                
                // Log security incident for AI attempting to comply with manipulation
                ContentModerationService.logSecurityIncident({
                  type: 'age_violation',
                  userId: socket.data.userId.toString(),
                  content: fullMessage,
                  patterns: filterResult.violations,
                  characterId: socket.data.characterId.toString(),
                  riskLevel: 'critical',
                  metadata: {
                    source: 'ai_response_filter',
                    originalLength: fullMessage.length,
                    filteredLength: filterResult.filteredResponse.length,
                    wasModified: filterResult.wasModified
                  }
                });
                
                // Use the filtered response instead of the original
                fullMessage = filterResult.filteredResponse;
                console.log(`🛡️ Response replaced with safe alternative: "${fullMessage}"`);
              }
              // ===== END AI RESPONSE FILTERING =====
              
              // Only log if there are issues or successful completion
              if (!fullMessage.trim()) {
                console.error('❌ Empty AI response received');
                socket.emit('error', { message: 'Empty response from AI' });
              } else if (fullMessage.trim() === '!!!!!!!!!!') {
                console.error('❌ Placeholder response - likely filtered');
                socket.emit('error', { message: 'Response filtered. Try different message.' });
              } else if (fullMessage.length < 50) {
                console.warn(`⚠️ Unusually short response (${fullMessage.length} chars): "${fullMessage}"`);
                console.log(`✅ ${character.name} → ${username}: "${fullMessage.trim()}" (${fullMessage.length} chars)`);
              } else {
                console.log(`✅ ${character.name} → ${username}: "${fullMessage.trim()}" (${fullMessage.length} chars)`);
              }
              resolve(null);
            });
            
            response.body!.on('error', (err: Error) => {
              console.error('❌ Stream error:', err.message);
              console.error('❌ Stream error details:', err);
              reject(err);
            });
          });

          // Emit end event and save message
          socket.emit("end");
          
          const aiMessage = {
            messageId: (Date.now() + 1).toString(),
            senderType: 'ai' as const,
            content: fullMessage,
            timestamp: new Date(),
          };

          conversation.messages.push(aiMessage as any);
          await conversation.save();
          
          if (ioInstance) {
            ioInstance.to(`character-${characterId}`).emit("receive-message", aiMessage);
          }

        } catch (error) {
          console.error('❌ AI request failed:', error instanceof Error ? error.message : 'Unknown error');
          socket.emit("error", { message: "AI service temporarily unavailable." });
        }
      });

      // Voice calling functionality - OPTIMIZED
      socket.on('voice-join-room', (data, callback) => {
        try {
          const { characterId } = data;
          
          // Input validation
          if (!characterId) {
            const error = 'Missing characterId for voice room join';
            console.error('❌ Voice join error:', error);
            if (callback) callback({ success: false, error });
            return;
          }

          const sessionKey = `${userId}-${characterId}`;
          
          console.log(`🎤 User joining voice room: ${sessionKey}`);
          socket.join(`voice-${sessionKey}`);
          
          // Enhanced response with connection details
          const response = { 
            success: true, 
            sessionKey, 
            timestamp: new Date(),
            userId,
            characterId 
          };
          
          socket.emit('voice-room-joined', response);
          if (callback) callback(response);
          
        } catch (error) {
          console.error('❌ Error joining voice room:', error);
          const errorResponse = { success: false, error: error.message };
          if (callback) callback(errorResponse);
          socket.emit('voice-error', errorResponse);
        }
      });

      socket.on('voice-leave-room', (data, callback) => {
        try {
          const { characterId } = data;
          
          if (!characterId) {
            const error = 'Missing characterId for voice room leave';
            console.error('❌ Voice leave error:', error);
            if (callback) callback({ success: false, error });
            return;
          }

          const sessionKey = `${userId}-${characterId}`;
          
          console.log(`🔇 User leaving voice room: ${sessionKey}`);
          socket.leave(`voice-${sessionKey}`);
          
          const response = { 
            success: true, 
            sessionKey, 
            timestamp: new Date() 
          };
          
          socket.emit('voice-room-left', response);
          if (callback) callback(response);
          
        } catch (error) {
          console.error('❌ Error leaving voice room:', error);
          const errorResponse = { success: false, error: error.message };
          if (callback) callback(errorResponse);
          socket.emit('voice-error', errorResponse);
        }
      });

      socket.on('voice-audio-data', (data) => {
        try {
          const { characterId, audioData } = data;
          
          // Input validation
          if (!characterId || !audioData) {
            console.warn('⚠️ Invalid voice audio data: missing characterId or audioData');
            return;
          }
          
          const sessionKey = `${userId}-${characterId}`;
          
          // Optimize audio data processing with faster buffer conversion
          let audioBuffer: Buffer;
          
          if (Buffer.isBuffer(audioData)) {
            audioBuffer = audioData;
          } else if (typeof audioData === 'string') {
            // Handle base64 encoded audio
            audioBuffer = Buffer.from(audioData, 'base64');
          } else if (Array.isArray(audioData)) {
            // Handle array of numbers (from frontend Uint8Array) - most common case
            audioBuffer = Buffer.from(audioData);
          } else {
            console.warn('⚠️ Invalid audio data format received:', typeof audioData);
            socket.emit('voice-error', { 
              message: 'Invalid audio data format', 
              sessionKey 
            });
            return;
          }
          
          // Process audio with error handling
          try {
            handleVoiceAudio(sessionKey, audioBuffer);
          } catch (audioError) {
            console.error('❌ Error processing voice audio:', audioError);
            socket.emit('voice-error', { 
              message: 'Audio processing failed', 
              sessionKey,
              error: audioError.message 
            });
          }
          
        } catch (error) {
          console.error('❌ Error handling voice audio data:', error);
          socket.emit('voice-error', { 
            message: 'Voice audio handling failed', 
            error: error.message 
          });
        }
      });

      socket.on('voice-mute', (data, callback) => {
        try {
          const { characterId, muted } = data;
          
          if (!characterId || typeof muted !== 'boolean') {
            const error = 'Invalid mute data: missing characterId or muted boolean';
            console.error('❌ Voice mute error:', error);
            if (callback) callback({ success: false, error });
            return;
          }

          const sessionKey = `${userId}-${characterId}`;
          
          console.log(`🔇 User ${muted ? 'muted' : 'unmuted'} in session: ${sessionKey}`);
          
          const muteData = {
            userId,
            muted,
            timestamp: new Date(),
            sessionKey
          };
          
          socket.to(`voice-${sessionKey}`).emit('voice-user-muted', muteData);
          
          if (callback) {
            callback({ success: true, muted, timestamp: muteData.timestamp });
          }
          
        } catch (error) {
          console.error('❌ Error handling voice mute:', error);
          const errorResponse = { success: false, error: error.message };
          if (callback) callback(errorResponse);
          socket.emit('voice-error', errorResponse);
        }
      });

      // Add voice connection status check
      socket.on('voice-ping', (data, callback) => {
        try {
          const { characterId } = data;
          const sessionKey = `${userId}-${characterId}`;
          
          if (callback) {
            callback({ 
              success: true, 
              sessionKey, 
              timestamp: new Date(),
              latency: Date.now() - (data.timestamp || Date.now())
            });
          }
        } catch (error) {
          console.error('❌ Error handling voice ping:', error);
          if (callback) callback({ success: false, error: error.message });
        }
      });

      socket.on('disconnect', async (reason) => {
        console.log(`❌ User ${userId} disconnected from character ${characterId}: ${reason}`);
        console.log('📊 Disconnect details:', {
          socketId: socket.id,
          reason,
          userId,
          characterId,
          transport: socket.conn?.transport?.name
        });

        // Enhanced voice session cleanup on disconnect
        if (characterId) {
          const sessionKey = `${userId}-${characterId}`;
          
          try {
            // Import voice cleanup functions using ES modules
            const voiceModule = await import('../routes/voice.js');
            const handleVoiceSessionCleanup = voiceModule.handleVoiceSessionCleanup;
            
            // Clean up any active voice sessions for this user-character combination
            if (handleVoiceSessionCleanup) {
              handleVoiceSessionCleanup(sessionKey, reason);
              console.log(`🔇 Voice session cleanup completed for: ${sessionKey}`);
            } else {
              console.warn('⚠️ Voice session cleanup function not available');
            }
          } catch (error) {
            console.error('❌ Error during voice session cleanup:', error);
          }
        }
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });

    console.log('Socket.IO server setup complete');
    
    // Set up image generation completion handler
    setupImageResponseHandler(ioInstance);
    
    // Make io instance globally available for voice service
    (global as any).io = ioInstance;
  }
  return ioInstance;
}

/**
 * Setup image generation completion handler to automatically generate AI responses
 */
function setupImageResponseHandler(io: Server) {
  console.log('Setting up image response handler...');
  
  // Listen for image generation completion
  console.log('Setting up jobCompleted event listener...');
  asyncImageGenerationService.on('jobCompleted', async (job) => {
    console.log(`🎯 Received jobCompleted event for job ${job.id}`);
    try {
      // Skip if no valid request data
      if (!job.request || !job.request.characterId || !job.result?.imageUrl) {
        console.log('⚠️ Skipping image response - missing character or image data');
        return;
      }

      const { characterId, prompt, characterName } = job.request;
      const { imageUrl } = job.result;
      const userId = job.userId;

      console.log(`🔍 DEBUG - Image job data:`, {
        characterId: characterId,
        characterIdType: typeof characterId,
        userId: userId,
        userIdType: typeof userId,
        prompt: prompt?.substring(0, 50)
      });

      console.log(`🖼️ Image generated for character ${characterName} (${characterId}) - generating AI response...`);

      // Generate contextual AI response
      const aiResponse = await ImageResponseService.generateImageResponse(
        prompt || 'Image generated',
        characterId,
        userId
      );

      console.log(`💬 Generated image response: "${aiResponse.substring(0, 100)}..."`);

      // Find or create the chat to add the AI response
      console.log(`🔍 DEBUG - Looking for chat with:`, {
        userId: userId,
        characterId: typeof characterId === 'string' ? parseInt(characterId) : characterId,
        characterIdOriginal: characterId
      });
      
      let chat = await ChatsModel.findOne({ 
        userId, 
        characterId: typeof characterId === 'string' ? parseInt(characterId) : characterId
      });
      
      console.log(`🔍 DEBUG - Chat found:`, !!chat);

      // If no chat exists, create one for the image response
      if (!chat) {
        console.log(`📝 Creating new chat for user ${userId} and character ${characterId}`);
        chat = new ChatsModel({
          userId,
          characterId: typeof characterId === 'string' ? parseInt(characterId) : characterId,
          messages: [],
          lastActivity: new Date()
        });
        await chat.save();
        console.log(`✅ Created new chat for image response`);
      }

      // Create AI response message
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        senderId: characterId.toString(),
        senderType: 'ai' as const,
        content: aiResponse,
        timestamp: new Date(),
        characterId: characterId.toString(),
        characterName: characterName || 'Character'
      };

      // Add AI response message to chat
      chat.messages.push(aiMessage as any);
      chat.lastActivity = new Date();
      await chat.save();

      // Emit the AI response to the user via socket
      const userSockets = await io.in(`user-${userId}`).fetchSockets();
      if (userSockets.length > 0) {
        userSockets.forEach(socket => {
          console.log(`📡 Sending image response to user ${userId} via socket`);
          socket.emit('ai-image-response', {
            characterId,
            characterName: characterName || 'Character',
            message: aiMessage,
            imageUrl: imageUrl
          });
        });
      } else {
        console.log(`⚠️ No active socket found for user ${userId} - response saved to chat only`);
      }

      console.log(`✅ Image response sent for character ${characterName}: "${aiResponse.substring(0, 50)}..."`);
    } catch (error) {
      console.error('❌ Error handling image completion:', error);
    }
  });

  console.log('Image response handler setup complete');
}