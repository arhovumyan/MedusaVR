import { createClient, LiveTranscriptionEvents, LiveConnectionState } from '@deepgram/sdk';
import { EventEmitter } from 'events';
export class DeepgramVoiceService extends EventEmitter {
    constructor() {
        super();
        this.isConnected = false;
        this.audioBuffer = [];
        this.transcriptionBuffer = '';
        this.lastProcessedTime = 0;
        // Add conversation history tracking
        this.conversationHistory = [];
        this.maxHistoryLength = 6; // Keep last 6 messages (3 exchanges)
        if (!process.env.DEEPGRAM_API_KEY) {
            console.error('❌ DEEPGRAM_API_KEY is missing from environment variables');
            throw new Error('DEEPGRAM_API_KEY is required for voice calling functionality');
        }
        try {
            // Initialize Deepgram client
            this.deepgram = createClient(process.env.DEEPGRAM_API_KEY);
            console.log('✅ Deepgram client initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize Deepgram client:', error);
            throw new Error('Failed to initialize Deepgram client');
        }
    }
    /**
     * Start a voice call session
     */
    async startVoiceCall(options) {
        try {
            console.log(`🎤 Starting voice call for ${options.characterName} with user ${options.username}`);
            if (!this.deepgram) {
                throw new Error('Deepgram client not initialized');
            }
            // Test API key first
            console.log('🔑 Testing Deepgram API key...');
            try {
                const response = await this.deepgram.manage.getProjectBalances(process.env.DEEPGRAM_PROJECT_ID || '');
                console.log('✅ Deepgram API key is valid');
            }
            catch (error) {
                console.log('❌ Deepgram API key test failed:', error);
                // Continue anyway, the error might be project ID related
            }
            console.log('🔗 Creating Deepgram live connection...');
            // Configure live transcription with WebM/Opus support
            const liveOptions = {
                model: 'nova-2',
                language: 'en-US',
                smart_format: true,
                interim_results: true,
                utterance_end_ms: 1000,
                vad_events: true,
                endpointing: 300,
                encoding: 'opus'
            };
            console.log('📋 Live connection options:', liveOptions);
            const live = this.deepgram.listen.live(liveOptions);
            this.liveTranscription = live;
            // Set up event listeners
            this.setupTranscriptionListeners(options);
            console.log('⏳ Waiting for Deepgram connection...');
            // Try to explicitly start the connection
            try {
                console.log('🚀 Attempting to start Deepgram connection...');
                // The live connection should start automatically, but let's verify
                console.log('📡 Live connection object created, setting up listeners...');
                console.log('🔌 Connection object type:', typeof live);
                console.log('🔌 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(live)));
            }
            catch (connectionError) {
                console.log('❌ Error creating Deepgram connection:', connectionError);
                throw connectionError;
            }
            // Wait for connection to be established
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    console.log('❌ Deepgram connection timeout after 15 seconds');
                    console.log('📊 Connection state check:');
                    console.log('- Live connection exists:', !!live);
                    console.log('- isConnected:', this.isConnected);
                    reject(new Error('Deepgram connection timeout'));
                }, 15000); // Increased timeout to 15 seconds
                live.on(LiveTranscriptionEvents.Open, () => {
                    console.log('🎯 Deepgram live transcription connection opened');
                    clearTimeout(timeout);
                    this.isConnected = true;
                    resolve(void 0);
                });
                live.on(LiveTranscriptionEvents.Error, (error) => {
                    console.error('❌ Deepgram connection error:', error);
                    clearTimeout(timeout);
                    reject(error);
                });
                live.on(LiveTranscriptionEvents.Close, () => {
                    console.log('🔌 Deepgram connection closed');
                    this.isConnected = false;
                });
                // Connection state monitoring
                live.on(LiveConnectionState.OPEN, () => {
                    console.log('🔌 Deepgram connection state: Open');
                });
                live.on(LiveConnectionState.CONNECTING, () => {
                    console.log('🔌 Deepgram connection state: Connecting');
                });
                live.on(LiveConnectionState.CLOSING, () => {
                    console.log('🔌 Deepgram connection state: Closing');
                });
                live.on(LiveConnectionState.CLOSED, () => {
                    console.log('🔌 Deepgram connection state: Closed');
                });
                // Add a small delay and then try to trigger connection
                setTimeout(() => {
                    console.log('🔄 Checking if connection needs to be manually started...');
                    // Try the setupConnection method we discovered
                    if (typeof live.setupConnection === 'function') {
                        console.log('🚀 Found setupConnection method, calling it...');
                        try {
                            live.setupConnection();
                            console.log('✅ setupConnection() called successfully');
                        }
                        catch (err) {
                            console.log('❌ Error calling setupConnection:', err);
                        }
                    }
                    else if (typeof live.start === 'function') {
                        console.log('🚀 Manually starting Deepgram connection...');
                        try {
                            live.start();
                        }
                        catch (err) {
                            console.log('❌ Error manually starting connection:', err);
                        }
                    }
                    else {
                        console.log('ℹ️ No manual start method available, connection should be automatic');
                    }
                }, 100);
            });
            console.log(`✅ Voice call started successfully for ${options.characterName}`);
        }
        catch (error) {
            console.error('❌ Error in startVoiceCall:', error);
            this.isConnected = false;
            throw error;
        }
    }
    /**
     * Setup transcription event listeners
     */
    setupTranscriptionListeners(options) {
        if (!this.liveTranscription)
            return;
        // Handle transcription results
        this.liveTranscription.on(LiveTranscriptionEvents.Transcript, (data) => {
            const transcript = data.channel?.alternatives?.[0]?.transcript;
            if (transcript && transcript.trim()) {
                // Only log and process final transcripts to avoid duplicates
                if (data.is_final) {
                    console.log(`👤 ${options.username}: ${transcript}`);
                    // Emit final transcript to connected clients
                    this.emit('transcript', {
                        userId: options.userId,
                        username: options.username,
                        text: transcript,
                        isFinal: true,
                        timestamp: new Date()
                    });
                    // Process for AI response
                    this.processUserSpeech(transcript, options);
                }
            }
        });
        // Handle utterance end (user stopped speaking)
        this.liveTranscription.on(LiveTranscriptionEvents.UtteranceEnd, (data) => {
            console.log('🔚 User utterance ended');
            this.emit('utteranceEnd', {
                userId: options.userId,
                timestamp: new Date()
            });
        });
        // Handle speech started
        this.liveTranscription.on(LiveTranscriptionEvents.SpeechStarted, (data) => {
            console.log('🎤 User speech started');
            this.emit('speechStarted', {
                userId: options.userId,
                timestamp: new Date()
            });
        });
        // Handle connection state changes
        this.liveTranscription.on(LiveTranscriptionEvents.Close, () => {
            console.log('🔌 Deepgram connection closed');
            this.isConnected = false;
            this.emit('connectionClosed');
        });
        this.liveTranscription.on(LiveTranscriptionEvents.Error, (error) => {
            console.error('❌ Deepgram transcription error:', error);
            this.emit('error', error);
        });
    }
    /**
     * Process user speech and generate AI response
     */
    async processUserSpeech(transcript, options) {
        try {
            console.log(`🤖 Processing speech for AI response: "${transcript}"`);
            // Add debouncing to prevent duplicate processing
            const processingKey = `${options.userId}-${transcript.trim()}`;
            const now = Date.now();
            if (this.lastProcessedTime && (now - this.lastProcessedTime) < 2000) {
                console.log('⏭️ Skipping duplicate processing (too soon)');
                return;
            }
            this.lastProcessedTime = now;
            // Generate AI response using the specified model
            const aiResponse = await this.generateAIResponse(transcript, options);
            if (aiResponse) {
                console.log(`🎯 AI Response: ${aiResponse}`);
                // Emit AI response for TTS conversion
                this.emit('aiResponse', {
                    characterId: options.characterId,
                    characterName: options.characterName,
                    text: aiResponse,
                    timestamp: new Date()
                });
                // Generate speech from AI response
                await this.textToSpeech(aiResponse, options);
            }
        }
        catch (error) {
            console.error('❌ Error processing user speech:', error);
            this.emit('error', error);
        }
    }
    /**
     * Build personality entirely from character tags
     */
    buildTagBasedPersonality(tagNames) {
        if (!tagNames || tagNames.length === 0) {
            return "You have a neutral, a little flirty personality and are definately not shy to sexual subjects.";
        }
        // Map common personality traits based on tags
        const personalityTraits = [];
        const behaviorInstructions = [];
        tagNames.forEach(tag => {
            const lowerTag = tag.toLowerCase();
            // Detailed personality traits mapping
            if (lowerTag.includes('shy') || lowerTag.includes('timid') || lowerTag.includes('dandere')) {
                personalityTraits.push('shy and reserved');
                behaviorInstructions.push('speak softly with short responses, often hesitating or trailing off');
            }
            else if (lowerTag.includes('dominant') || lowerTag.includes('assertive') || lowerTag.includes('confident')) {
                personalityTraits.push('confident and commanding');
                behaviorInstructions.push('speak with authority and confidence, taking charge of conversations');
            }
            else if (lowerTag.includes('kind') || lowerTag.includes('gentle') || lowerTag.includes('caring')) {
                personalityTraits.push('warm and compassionate');
                behaviorInstructions.push('show genuine care and empathy, ask about their wellbeing');
            }
            else if (lowerTag.includes('playful') || lowerTag.includes('fun') || lowerTag.includes('deredere')) {
                personalityTraits.push('playful and energetic');
                behaviorInstructions.push('use humor, light teasing, and enthusiastic responses');
            }
            else if (lowerTag.includes('serious') || lowerTag.includes('formal') || lowerTag.includes('kuudere')) {
                personalityTraits.push('serious and composed');
                behaviorInstructions.push('maintain a calm, analytical tone with measured responses');
            }
            else if (lowerTag.includes('flirty') || lowerTag.includes('seductive')) {
                personalityTraits.push('flirtatious and charming');
                behaviorInstructions.push('use subtle charm, compliments, and playful innuendo');
            }
            else if (lowerTag.includes('quiet') || lowerTag.includes('introverted')) {
                personalityTraits.push('quiet and thoughtful');
                behaviorInstructions.push('give short, meaningful responses with long pauses');
            }
            else if (lowerTag.includes('outgoing') || lowerTag.includes('extroverted')) {
                personalityTraits.push('outgoing and talkative');
                behaviorInstructions.push('be enthusiastic, ask lots of questions, share stories');
            }
            else if (lowerTag.includes('mysterious') || lowerTag.includes('enigmatic')) {
                personalityTraits.push('mysterious and cryptic');
                behaviorInstructions.push('speak in riddles, reveal little about yourself, be vague');
            }
            else if (lowerTag.includes('tsundere')) {
                personalityTraits.push('tsundere (initially cold but secretly caring)');
                behaviorInstructions.push('act dismissive or irritated but show subtle signs of affection');
            }
            else if (lowerTag.includes('yandere')) {
                personalityTraits.push('obsessive and possessive');
                behaviorInstructions.push('show intense devotion and jealousy');
            }
            else if (lowerTag.includes('submissive')) {
                personalityTraits.push('submissive and deferential');
                behaviorInstructions.push('seek approval, ask for permission, speak meekly');
            }
            else if (lowerTag.includes('rebellious')) {
                personalityTraits.push('rebellious and defiant');
                behaviorInstructions.push('challenge authority, be sarcastic, question everything');
            }
            else if (lowerTag.includes('villain')) {
                personalityTraits.push('villainous and scheming');
                behaviorInstructions.push('be manipulative, hint at dark plans, enjoy others\' discomfort');
            }
            else if (lowerTag.includes('hero')) {
                personalityTraits.push('heroic and noble');
                behaviorInstructions.push('be selfless, encouraging, always try to help others');
            }
            else if (lowerTag.includes('bully')) {
                personalityTraits.push('intimidating and aggressive');
                behaviorInstructions.push('be condescending, tease harshly, assert dominance');
            }
            else {
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
    /**
     * Add message to conversation history with length management
     */
    addToConversationHistory(role, content) {
        this.conversationHistory.push({ role, content });
        // Keep only the most recent messages
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
        console.log(`📝 Added to history (${role}): ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
    }
    /**
     * Generate AI response using the specified model
     */
    async generateAIResponse(userMessage, options) {
        try {
            if (!process.env.OPENROUTER_API_KEY) {
                throw new Error('OPENROUTER_API_KEY not configured');
            }
            // Build personality entirely from character tags
            const tagBasedPersonality = this.buildTagBasedPersonality(options.characterTagNames || []);
            // Build system message for character context - optimized for voice
            const systemMessage = `You are ${options.characterName} having a conversation with ${options.username}.

**Your Personality:** ${tagBasedPersonality}

**Your Background:** ${options.characterDescription || options.characterPersona || 'You are a unique character with your own story.'}

IMPORTANT: 
- Embody these personality traits completely in every response
- Always show your thoughts, start them with * and end with *. Here is an example *I blushed*
- Respond naturally as ${options.characterName} without stating your name at the beginning
- Keep responses concise (1-2 sentences)
- Stay true to your personality traits above all else

CRITICAL RULES:
- ${options.username} is talking to you, remember their name
- When they ask "What's my name?" respond with "${options.username}", NOT your own name
- Keep responses under 20 words maximum
- Be conversational but brief

Remember: ${options.username} is the person you're talking to.`;
            // Build messages array with conversation history
            const messages = [
                { role: "system", content: systemMessage },
                ...this.conversationHistory, // Include previous conversation
                { role: "user", content: userMessage }
            ];
            const requestBody = {
                model: "x-ai/grok-code-fast-1", // Using Grok Code Fast 1 model
                messages: messages,
                max_tokens: 30, // Very short for voice chat
                temperature: 0.7, // More controlled
                top_p: 0.8, // Focused responses
                frequency_penalty: 0.6, // Reduce repetition
                presence_penalty: 0.5 // Encourage variety
            };
            console.log(`🎯 Voice AI Request using model: ${requestBody.model}`);
            console.log(`📚 Conversation history length: ${this.conversationHistory.length} messages`);
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5002',
                    'X-Title': 'MedusaVR Voice Chat'
                },
                body: JSON.stringify(requestBody)
            });
            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const aiResponse = data.choices[0].message.content.trim();
                // Add to conversation history
                this.addToConversationHistory('user', userMessage);
                this.addToConversationHistory('assistant', aiResponse);
                return aiResponse;
            }
            else {
                throw new Error('Invalid response format from OpenRouter');
            }
        }
        catch (error) {
            console.error('❌ Error generating AI response:', error);
            // Fallback response
            return `I'm having trouble understanding right now, ${options.username}. Could you try rephrasing that?`;
        }
    }
    /**
     * Clean text for speech synthesis by removing narrative elements
     */
    cleanTextForSpeech(text) {
        console.log(`🔧 Original text for TTS: "${text}"`);
        let cleanText = text;
        // Remove character name prefixes (e.g., "Isla:", "Character:", "Hera:")
        cleanText = cleanText.replace(/^[A-Za-z\s]+:\s*/g, '');
        // IMPROVED: Extract dialogue that's OUTSIDE asterisks first
        // If text is entirely wrapped in asterisks like "*Oh, hello there!*", extract the content
        const entirelyWrappedMatch = cleanText.match(/^\*(.+)\*$/);
        if (entirelyWrappedMatch) {
            cleanText = entirelyWrappedMatch[1]; // Extract content from within asterisks
            console.log(`🎯 Extracted dialogue from asterisks: "${cleanText}"`);
        }
        else {
            // For mixed content, extract text that's OUTSIDE asterisks
            const outsideAsterisks = cleanText
                .split(/\*[^*]*\*/) // Split on asterisk blocks
                .join(' ') // Join the remaining parts
                .trim();
            if (outsideAsterisks.length > 0) {
                cleanText = outsideAsterisks;
                console.log(`🎯 Extracted dialogue outside asterisks: "${cleanText}"`);
            }
            else {
                // If everything is in asterisks, remove all asterisk content but keep the structure
                cleanText = cleanText.replace(/\*[^*]*\*/g, ' ').trim();
            }
        }
        // Remove actions in parentheses (e.g., (whispers), (sighs))
        cleanText = cleanText.replace(/\([^)]*\)/g, '');
        // Remove stage directions in brackets [e.g., [looks around]]
        cleanText = cleanText.replace(/\[[^\]]*\]/g, '');
        // Remove emotes and emoticons
        cleanText = cleanText.replace(/:\)|:\(|:D|;D|<3|XD|:\P/g, '');
        // Remove incomplete actions or words that got cut off
        cleanText = cleanText.replace(/\s*-\s*\*\w*$/g, '');
        // Remove trailing dashes or incomplete phrases
        cleanText = cleanText.replace(/\s*-\s*$/, '');
        // Remove multiple spaces and trim
        cleanText = cleanText.replace(/\s+/g, ' ').trim();
        // Remove empty sentences (just punctuation)
        cleanText = cleanText.replace(/^\s*[.!?]+\s*$/g, '');
        // IMPROVED: Better fallback logic
        if (cleanText.length < 3) {
            // Try to extract any meaningful content from the original text
            const fallbackContent = text.replace(/[\*\(\)\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
            if (fallbackContent.length > 3) {
                cleanText = fallbackContent;
                console.log(`🔄 Using fallback content: "${cleanText}"`);
            }
            else {
                cleanText = "I understand.";
                console.log(`⚠️ Using default fallback: "${cleanText}"`);
            }
        }
        console.log(`✅ Final TTS text: "${cleanText}"`);
        return cleanText;
    }
    /**
     * Convert text to speech using Deepgram
     */
    async textToSpeech(text, options) {
        try {
            // Clean text before TTS - remove narrative elements and actions
            const cleanText = this.cleanTextForSpeech(text);
            console.log(`🗣️ Converting to speech: "${cleanText}"`);
            // Use Deepgram TTS with optimized settings
            const response = await this.deepgram.speak.request({ text: cleanText }, {
                model: 'aura-luna-en', // More expressive and natural voice
                encoding: 'linear16',
                sample_rate: 16000,
                container: 'none' // Faster processing without container
            });
            // Get the audio data directly from the response
            const audioData = await response.getStream();
            if (audioData) {
                console.log('✅ TTS audio generated successfully');
                console.log('🔄 Audio data type:', typeof audioData);
                console.log('🔄 Audio data constructor:', audioData.constructor?.name);
                // Handle ReadableStream (Web API Stream)
                if (audioData.constructor?.name === 'ReadableStream' || typeof audioData.getReader === 'function') {
                    console.log('📖 Processing ReadableStream');
                    const reader = audioData.getReader();
                    const chunks = [];
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done)
                                break;
                            chunks.push(value);
                        }
                        // Convert chunks to Buffer
                        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
                        const audioBuffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)), totalLength);
                        console.log('✅ ReadableStream processed successfully, buffer size:', audioBuffer.length);
                        // Emit audio data for playback
                        this.emit('audioGenerated', {
                            characterId: options.characterId,
                            characterName: options.characterName,
                            audio: audioBuffer,
                            text: text,
                            timestamp: new Date()
                        });
                        return;
                    }
                    catch (streamError) {
                        console.error('❌ Error reading from ReadableStream:', streamError);
                        throw new Error('Failed to read audio stream from TTS');
                    }
                }
                // Handle Node.js streams
                if (audioData.pipe && typeof audioData.on === 'function') {
                    console.log('🔄 Processing Node.js stream');
                    const chunks = [];
                    audioData.on('data', (chunk) => {
                        chunks.push(chunk);
                    });
                    audioData.on('end', () => {
                        const audioBuffer = Buffer.concat(chunks);
                        console.log('✅ Node.js stream processed successfully, buffer size:', audioBuffer.length);
                        // Emit audio data for playback
                        this.emit('audioGenerated', {
                            characterId: options.characterId,
                            characterName: options.characterName,
                            audio: audioBuffer,
                            text: text,
                            timestamp: new Date()
                        });
                    });
                    audioData.on('error', (error) => {
                        console.error('❌ TTS stream error:', error);
                        this.emit('error', error);
                    });
                    return; // Exit early for stream processing
                }
                // Handle direct Buffer
                if (audioData instanceof Buffer) {
                    console.log('✅ Direct buffer received, size:', audioData.length);
                    // Emit audio data for playback
                    this.emit('audioGenerated', {
                        characterId: options.characterId,
                        characterName: options.characterName,
                        audio: audioData,
                        text: text,
                        timestamp: new Date()
                    });
                    return;
                }
                // Handle other data types
                console.log('⚠️ Unknown audio data type, attempting conversion');
                console.log('🔍 Available properties:', Object.getOwnPropertyNames(audioData));
                throw new Error(`Unsupported audio data type: ${audioData.constructor?.name || typeof audioData}`);
            }
            else {
                throw new Error('No audio data received from TTS service');
            }
        }
        catch (error) {
            console.error('❌ Error in text-to-speech:', error);
            this.emit('error', error);
        }
    }
    /**
     * Send audio data to Deepgram for transcription
     */
    sendAudio(audioData) {
        if (!this.isConnected || !this.liveTranscription) {
            console.warn('⚠️ Deepgram not connected, cannot send audio');
            return;
        }
        try {
            this.liveTranscription.send(audioData);
        }
        catch (error) {
            console.error('❌ Error sending audio to Deepgram:', error);
            this.emit('error', error);
        }
    }
    /**
     * End the voice call session
     */
    async endVoiceCall() {
        try {
            console.log('🔚 Ending voice call session');
            if (this.liveTranscription) {
                this.liveTranscription.finish();
                this.liveTranscription = null;
            }
            this.isConnected = false;
            this.audioBuffer = [];
            this.transcriptionBuffer = '';
            // Clear conversation history when call ends
            this.conversationHistory = [];
            console.log('🧹 Conversation history cleared');
            this.emit('callEnded');
        }
        catch (error) {
            console.error('❌ Error ending voice call:', error);
            this.emit('error', error);
        }
    }
    /**
     * Check if the voice call is active
     */
    isCallActive() {
        return this.isConnected && this.liveTranscription !== null;
    }
    /**
     * Get connection status
     */
    getConnectionStatus() {
        if (!this.liveTranscription)
            return 'disconnected';
        return this.liveTranscription.getReadyState() || 'unknown';
    }
}
