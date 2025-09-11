import { UserModel } from '../db/models/UserModel.js';
export class VoiceConversationService {
    /**
     * Start tracking a voice conversation
     */
    static startTracking(userId, characterId) {
        const sessionKey = `${userId}-${characterId}`;
        const now = Date.now();
        const tracker = {
            userId,
            characterId,
            startTime: now,
            lastUpdateTime: now,
            totalSeconds: 0,
            isActive: true
        };
        this.activeConversations.set(sessionKey, tracker);
        console.log(`🎤⏱️ Started tracking voice conversation: ${sessionKey}`);
        return sessionKey;
    }
    /**
     * Update conversation time and deduct coins
     */
    static async updateConversationTime(sessionKey) {
        const tracker = this.activeConversations.get(sessionKey);
        if (!tracker || !tracker.isActive)
            return;
        const now = Date.now();
        const secondsElapsed = Math.floor((now - tracker.lastUpdateTime) / 1000);
        if (secondsElapsed >= 1) {
            tracker.totalSeconds += secondsElapsed;
            tracker.lastUpdateTime = now;
            // Deduct coins for each second
            try {
                const user = await UserModel.findById(tracker.userId);
                if (user && user.coins > 0) {
                    // Deduct 1 coin per second
                    const coinsToDeduct = Math.min(secondsElapsed, user.coins);
                    user.coins -= coinsToDeduct;
                    await user.save();
                    console.log(`🪙 Deducted ${coinsToDeduct} coins for ${secondsElapsed}s of voice chat. Remaining: ${user.coins}`);
                    // If user runs out of coins, end the conversation
                    if (user.coins <= 0) {
                        console.log(`❌ User ${tracker.userId} ran out of coins, ending voice conversation`);
                        this.endTracking(sessionKey);
                        // Emit a specific event for insufficient coins
                        const io = global.io;
                        if (io) {
                            io.to(`voice-${sessionKey}`).emit('voice-insufficient-coins', {
                                message: 'Voice call ended due to insufficient coins',
                                coinsSpent: tracker.totalSeconds,
                                duration: tracker.totalSeconds
                            });
                        }
                        return;
                    }
                }
                else {
                    console.log(`❌ User ${tracker.userId} has insufficient coins, ending voice conversation`);
                    this.endTracking(sessionKey);
                    // Emit a specific event for insufficient coins
                    const io = global.io;
                    if (io) {
                        io.to(`voice-${sessionKey}`).emit('voice-insufficient-coins', {
                            message: 'Voice call ended due to insufficient coins',
                            coinsSpent: tracker.totalSeconds,
                            duration: tracker.totalSeconds
                        });
                    }
                }
            }
            catch (error) {
                console.error('❌ Error deducting coins for voice conversation:', error);
            }
        }
    }
    /**
     * End tracking a voice conversation
     */
    static endTracking(sessionKey) {
        const tracker = this.activeConversations.get(sessionKey);
        if (!tracker)
            return null;
        // Final time update
        const now = Date.now();
        const finalSecondsElapsed = Math.floor((now - tracker.lastUpdateTime) / 1000);
        tracker.totalSeconds += finalSecondsElapsed;
        tracker.isActive = false;
        console.log(`🎤⏹️ Ended voice conversation tracking: ${sessionKey} (Total: ${tracker.totalSeconds}s)`);
        // Remove from active conversations
        this.activeConversations.delete(sessionKey);
        return tracker;
    }
    /**
     * Get conversation stats
     */
    static getConversationStats(sessionKey) {
        return this.activeConversations.get(sessionKey) || null;
    }
    /**
     * Check if user has sufficient coins for voice chat
     */
    static async hasEnoughCoins(userId) {
        try {
            const user = await UserModel.findById(userId);
            return user ? (user.coins || 0) > 0 : false;
        }
        catch (error) {
            console.error('❌ Error checking user coins:', error);
            return false;
        }
    }
    /**
     * Start interval for tracking active conversations
     */
    static startTrackingInterval() {
        console.log('🎤⏱️ Starting voice conversation tracking interval...');
        return setInterval(async () => {
            const activeKeys = Array.from(this.activeConversations.keys());
            if (activeKeys.length > 0) {
                console.log(`🔄 Updating ${activeKeys.length} active voice conversations...`);
            }
            const promises = activeKeys.map(sessionKey => this.updateConversationTime(sessionKey));
            await Promise.all(promises);
        }, 1000); // Update every second
    }
    /**
     * Get all active conversations (for debugging)
     */
    static getActiveConversations() {
        return new Map(this.activeConversations);
    }
    /**
     * Clean up inactive conversations (for maintenance)
     */
    static cleanupInactiveConversations() {
        const now = Date.now();
        const timeoutMs = 5 * 60 * 1000; // 5 minutes
        for (const [sessionKey, tracker] of this.activeConversations.entries()) {
            if (now - tracker.lastUpdateTime > timeoutMs) {
                console.log(`🧹 Cleaning up inactive voice conversation: ${sessionKey}`);
                this.endTracking(sessionKey);
            }
        }
    }
}
VoiceConversationService.activeConversations = new Map();
