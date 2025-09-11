import express from 'express';
import { DeepgramVoiceService } from '../services/DeepgramVoiceService.js';
import { VoiceConversationService } from '../services/VoiceConversationService.js';
import { requireAuth } from '../middleware/auth.js';
import { CharacterModel } from '../db/models/CharacterModel.js';
const router = express.Router();
// Store active voice sessions
const activeSessions = new Map();
// Tracking interval will be initialized when needed
let trackingInterval = null;
// Initialize conversation tracking when first route is accessed
function initializeConversationTracking() {
    if (!trackingInterval) {
        trackingInterval = VoiceConversationService.startTrackingInterval();
        console.log('🎤⏱️ Voice conversation tracking interval started');
    }
}
/**
 * Initialize voice call session
 */
router.post('/start/:characterId', requireAuth, async (req, res) => {
    try {
        // Initialize tracking on first use
        initializeConversationTracking();
        const { characterId } = req.params;
        const userId = req.userId; // Use req.userId which is set by auth middleware
        const username = req.user?.username || 'User';
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Check if user has enough coins for voice chat
        const hasCoins = await VoiceConversationService.hasEnoughCoins(userId);
        if (!hasCoins) {
            return res.status(402).json({ error: 'Insufficient coins for voice chat. Voice conversations cost 1 coin per second.' });
        }
        // Start tracking the voice conversation
        const trackingKey = VoiceConversationService.startTracking(userId, characterId);
        console.log(`🎤⏱️ Started tracking conversation: ${trackingKey}`);
        // Check if character exists
        const character = await CharacterModel.findOne({ id: parseInt(characterId) });
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        // Create session key
        const sessionKey = `${userId}-${characterId}`;
        // Check if session already exists
        if (activeSessions.has(sessionKey)) {
            return res.status(409).json({ error: 'Voice call already active for this character' });
        }
        // Create new voice service instance
        const voiceService = new DeepgramVoiceService();
        // Setup voice call options
        const callOptions = {
            characterId,
            characterName: character.name,
            characterPersona: character.description,
            characterDescription: character.description,
            characterTagNames: character.tagNames || [],
            userId,
            username
        };
        // Store session
        activeSessions.set(sessionKey, voiceService);
        // Setup event listeners for this session
        setupVoiceEventListeners(voiceService, sessionKey, callOptions);
        // Start the voice call
        await voiceService.startVoiceCall(callOptions);
        console.log(`🎤 Voice call started: ${username} with ${character.name}`);
        res.json({
            success: true,
            sessionId: sessionKey,
            characterName: character.name,
            message: 'Voice call started successfully. Billing: 1 coin per second.'
        });
    }
    catch (error) {
        console.error('❌ Error starting voice call:', error);
        res.status(500).json({
            error: 'Failed to start voice call',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * End voice call session
 */
router.post('/end/:characterId', requireAuth, async (req, res) => {
    try {
        const { characterId } = req.params;
        const userId = req.userId; // Use req.userId
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const sessionKey = `${userId}-${characterId}`;
        const voiceService = activeSessions.get(sessionKey);
        if (!voiceService) {
            return res.status(404).json({ error: 'No active voice call found' });
        }
        // End conversation time tracking and get stats
        const trackingKey = `${userId}-${characterId}`;
        const conversationStats = VoiceConversationService.endTracking(trackingKey);
        // End the voice call
        await voiceService.endVoiceCall();
        // Remove from active sessions
        activeSessions.delete(sessionKey);
        console.log(`🔚 Voice call ended: ${sessionKey}`);
        res.json({
            success: true,
            message: 'Voice call ended successfully',
            conversationStats: conversationStats ? {
                duration: conversationStats.totalSeconds,
                coinsSpent: conversationStats.totalSeconds
            } : null
        });
    }
    catch (error) {
        console.error('❌ Error ending voice call:', error);
        res.status(500).json({
            error: 'Failed to end voice call',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * Get voice call status
 */
router.get('/status/:characterId', requireAuth, async (req, res) => {
    try {
        const { characterId } = req.params;
        const userId = req.userId; // Use req.userId
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const sessionKey = `${userId}-${characterId}`;
        const voiceService = activeSessions.get(sessionKey);
        if (!voiceService) {
            return res.json({
                active: false,
                status: 'No active call'
            });
        }
        res.json({
            active: voiceService.isCallActive(),
            status: voiceService.getConnectionStatus(),
            sessionId: sessionKey
        });
    }
    catch (error) {
        console.error('❌ Error getting voice call status:', error);
        res.status(500).json({ error: 'Failed to get voice call status' });
    }
});
/**
 * Get all active voice sessions (admin endpoint)
 */
router.get('/sessions', requireAuth, async (req, res) => {
    try {
        const sessions = Array.from(activeSessions.keys()).map(sessionKey => {
            const voiceService = activeSessions.get(sessionKey);
            const conversationStats = VoiceConversationService.getConversationStats(sessionKey);
            return {
                sessionId: sessionKey,
                active: voiceService?.isCallActive() || false,
                status: voiceService?.getConnectionStatus() || 'unknown',
                conversationTime: conversationStats?.totalSeconds || 0,
                coinsSpent: conversationStats?.totalSeconds || 0
            };
        });
        res.json({
            activeSessions: sessions.length,
            sessions
        });
    }
    catch (error) {
        console.error('❌ Error getting voice sessions:', error);
        res.status(500).json({ error: 'Failed to get voice sessions' });
    }
});
/**
 * Setup voice event listeners for Socket.IO integration
 */
function setupVoiceEventListeners(voiceService, sessionKey, callOptions) {
    const io = global.io;
    // Handle transcript events
    voiceService.on('transcript', (data) => {
        console.log(`📝 Transcript: ${data.text}`);
        if (io) {
            io.to(`voice-${sessionKey}`).emit('voice-transcript', {
                userId: data.userId,
                username: data.username,
                text: data.text,
                isFinal: data.isFinal,
                timestamp: data.timestamp
            });
        }
    });
    // Handle AI response events
    voiceService.on('aiResponse', (data) => {
        console.log(`🤖 AI Response: ${data.text}`);
        if (io) {
            io.to(`voice-${sessionKey}`).emit('voice-ai-response', {
                characterId: data.characterId,
                characterName: data.characterName,
                text: data.text,
                timestamp: data.timestamp
            });
        }
    });
    // Handle audio generation events
    voiceService.on('audioGenerated', (data) => {
        console.log(`🔊 Audio generated for: ${data.characterName}`);
        if (io) {
            // Convert buffer to base64 for transmission
            const audioBase64 = data.audio.toString('base64');
            io.to(`voice-${sessionKey}`).emit('voice-audio', {
                characterId: data.characterId,
                characterName: data.characterName,
                audio: audioBase64,
                text: data.text,
                timestamp: data.timestamp
            });
        }
    });
    // Handle speech events
    voiceService.on('speechStarted', (data) => {
        if (io) {
            io.to(`voice-${sessionKey}`).emit('voice-speech-started', data);
        }
    });
    voiceService.on('utteranceEnd', (data) => {
        if (io) {
            io.to(`voice-${sessionKey}`).emit('voice-utterance-end', data);
        }
    });
    // Handle connection events
    voiceService.on('connectionClosed', () => {
        console.log(`🔌 Voice connection closed: ${sessionKey}`);
        if (io) {
            io.to(`voice-${sessionKey}`).emit('voice-connection-closed');
        }
        // Clean up session
        activeSessions.delete(sessionKey);
    });
    // Handle errors
    voiceService.on('error', (error) => {
        console.error(`❌ Voice service error for ${sessionKey}:`, error);
        if (io) {
            io.to(`voice-${sessionKey}`).emit('voice-error', {
                message: error.message || 'Voice service error',
                timestamp: new Date()
            });
        }
    });
    // Handle call ended
    voiceService.on('callEnded', () => {
        console.log(`🔚 Voice call ended: ${sessionKey}`);
        // End conversation tracking
        VoiceConversationService.endTracking(sessionKey);
        if (io) {
            io.to(`voice-${sessionKey}`).emit('voice-call-ended');
        }
        // Clean up session
        activeSessions.delete(sessionKey);
    });
}
/**
 * Function to handle audio data from Socket.IO
 */
export function handleVoiceAudio(sessionKey, audioData) {
    const voiceService = activeSessions.get(sessionKey);
    if (voiceService && voiceService.isCallActive()) {
        voiceService.sendAudio(audioData);
    }
    else {
        console.warn(`⚠️ No active voice session found for: ${sessionKey}`);
    }
}
/**
 * Handle voice session cleanup when user disconnects
 */
export function handleVoiceSessionCleanup(sessionKey, reason) {
    try {
        const voiceService = activeSessions.get(sessionKey);
        if (voiceService) {
            console.log(`🔇 Cleaning up voice session: ${sessionKey} (reason: ${reason})`);
            // End the voice call
            voiceService.endVoiceCall().catch(error => {
                console.error(`❌ Error ending voice call during cleanup: ${error.message}`);
            });
            // End conversation tracking
            VoiceConversationService.endTracking(sessionKey);
            // Remove from active sessions
            activeSessions.delete(sessionKey);
            // Notify other participants in the voice room
            const io = global.io;
            if (io) {
                io.to(`voice-${sessionKey}`).emit('voice-call-ended', {
                    reason: 'User disconnected',
                    sessionKey,
                    timestamp: new Date()
                });
            }
            console.log(`✅ Voice session cleanup completed: ${sessionKey}`);
        }
        else {
            console.log(`ℹ️ No active voice session to cleanup: ${sessionKey}`);
        }
    }
    catch (error) {
        console.error(`❌ Error during voice session cleanup for ${sessionKey}:`, error);
    }
}
/**
 * Clean up all active sessions (for graceful shutdown)
 */
export async function cleanupVoiceSessions() {
    console.log('🧹 Cleaning up voice sessions...');
    // Stop tracking interval
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
    const cleanupPromises = Array.from(activeSessions.entries()).map(async ([sessionKey, voiceService]) => {
        try {
            // End conversation tracking
            VoiceConversationService.endTracking(sessionKey);
            // End voice service
            await voiceService.endVoiceCall();
        }
        catch (error) {
            console.error('❌ Error cleaning up voice session:', error);
        }
    });
    await Promise.all(cleanupPromises);
    activeSessions.clear();
    console.log('✅ Voice sessions cleanup completed');
}
/**
 * Get active sessions count
 */
export function getActiveSessionsCount() {
    return activeSessions.size;
}
export default router;
