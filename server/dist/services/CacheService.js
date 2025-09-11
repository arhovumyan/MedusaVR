import Redis from 'ioredis';
export class CacheService {
    constructor() {
        this.redis = null;
        this.metrics = {
            hits: 0,
            misses: 0,
            operations: 0,
            errors: 0
        };
        // TTL strategies (in seconds)
        this.TTL = {
            CHARACTER_LIST: 300, // 5 minutes
            CHARACTER_DETAIL: 600, // 10 minutes
            FEATURED_CHARS: 180, // 3 minutes
            IMAGE_METADATA: 900, // 15 minutes
            GENERATION_RESULT: 3600, // 1 hour
            USER_PREFERENCES: 1800 // 30 minutes
        };
        this.config = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            // Enable caching only if REDIS_HOST is explicitly set (Docker/production with Redis)
            // Disable by default for Railway/other cloud providers without Redis
            enabled: process.env.CACHE_ENABLED === 'true' && !!process.env.REDIS_HOST
        };
        console.log('Cache configuration:', {
            enabled: this.config.enabled,
            hasRedisHost: !!process.env.REDIS_HOST,
            cacheEnabledEnv: process.env.CACHE_ENABLED
        });
        if (this.config.enabled) {
            this.initializeRedis();
        }
        else {
            console.log('Cache disabled - app will run without Redis caching');
        }
    }
    initializeRedis() {
        try {
            this.redis = new Redis({
                host: this.config.host,
                port: this.config.port,
                password: this.config.password,
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                keepAlive: 30000,
                connectionName: 'medusavr-cache',
                // Graceful degradation - don't throw on Redis failures
                enableOfflineQueue: false
            });
            this.redis.on('connect', () => {
                console.log('Redis connected successfully');
            });
            this.redis.on('error', (err) => {
                console.warn('Redis error (graceful degradation enabled):', err.message);
                this.metrics.errors++;
            });
            this.redis.on('close', () => {
                console.log('Redis connection closed');
            });
        }
        catch (error) {
            console.warn('Redis initialization failed, caching disabled:', error);
            this.config.enabled = false;
        }
    }
    /**
     * Generic get method with automatic JSON parsing
     */
    async get(key) {
        if (!this.isEnabled())
            return null;
        try {
            this.metrics.operations++;
            const value = await this.redis.get(key);
            if (value === null) {
                this.metrics.misses++;
                return null;
            }
            this.metrics.hits++;
            return JSON.parse(value);
        }
        catch (error) {
            console.warn(`Cache GET error for key ${key}:`, error);
            this.metrics.errors++;
            return null;
        }
    }
    /**
     * Generic set method with automatic JSON serialization and TTL
     */
    async set(key, value, ttlSeconds) {
        if (!this.isEnabled())
            return false;
        try {
            this.metrics.operations++;
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.redis.setex(key, ttlSeconds, serialized);
            }
            else {
                await this.redis.set(key, serialized);
            }
            return true;
        }
        catch (error) {
            console.warn(`Cache SET error for key ${key}:`, error);
            this.metrics.errors++;
            return false;
        }
    }
    /**
     * Delete a cache key
     */
    async del(key) {
        if (!this.isEnabled())
            return false;
        try {
            this.metrics.operations++;
            await this.redis.del(key);
            return true;
        }
        catch (error) {
            console.warn(`⚠️ Cache DEL error for key ${key}:`, error);
            this.metrics.errors++;
            return false;
        }
    }
    /**
     * Delete multiple keys matching a pattern
     */
    async delPattern(pattern) {
        if (!this.isEnabled())
            return 0;
        try {
            this.metrics.operations++;
            const keys = await this.redis.keys(pattern);
            if (keys.length === 0)
                return 0;
            const deletedCount = await this.redis.del(...keys);
            return deletedCount;
        }
        catch (error) {
            console.warn(`⚠️ Cache DEL pattern error for ${pattern}:`, error);
            this.metrics.errors++;
            return 0;
        }
    }
    // ===== Character-specific cache methods =====
    /**
     * Cache character list with smart key generation
     */
    async cacheCharacterList(characters, mode, page, userId) {
        const key = this.getCharacterListKey(mode, page, userId);
        await this.set(key, characters, this.TTL.CHARACTER_LIST);
    }
    /**
     * Get cached character list
     */
    async getCharacterList(mode, page, userId) {
        const key = this.getCharacterListKey(mode, page, userId);
        return await this.get(key);
    }
    /**
     * Cache individual character details
     */
    async cacheCharacter(character) {
        const key = `characters:detail:${character.id}`;
        await this.set(key, character, this.TTL.CHARACTER_DETAIL);
    }
    /**
     * Get cached character details
     */
    async getCharacter(id) {
        const key = `characters:detail:${id}`;
        return await this.get(key);
    }
    /**
     * Cache featured characters for a user
     */
    async cacheFeaturedCharacters(characters, userId) {
        const key = `characters:featured:${userId}`;
        await this.set(key, characters, this.TTL.FEATURED_CHARS);
    }
    /**
     * Get cached featured characters
     */
    async getFeaturedCharacters(userId) {
        const key = `characters:featured:${userId}`;
        return await this.get(key);
    }
    /**
     * Cache user's generated images metadata
     */
    async cacheUserImages(username, characterName, images) {
        const key = `images:user:${username}:${characterName}`;
        await this.set(key, images, this.TTL.IMAGE_METADATA);
    }
    /**
     * Get cached user images metadata
     */
    async getUserImages(username, characterName) {
        const key = `images:user:${username}:${characterName}`;
        return await this.get(key);
    }
    /**
     * Cache image generation result
     */
    async cacheGenerationResult(jobId, result) {
        const key = `images:generation:${jobId}`;
        await this.set(key, result, this.TTL.GENERATION_RESULT);
    }
    /**
     * Get cached generation result
     */
    async getGenerationResult(jobId) {
        const key = `images:generation:${jobId}`;
        return await this.get(key);
    }
    // ===== Cache invalidation methods =====
    /**
     * Invalidate all character-related caches
     */
    async invalidateCharacterCaches(characterId) {
        if (characterId) {
            // Invalidate specific character
            await this.del(`characters:detail:${characterId}`);
        }
        // Invalidate all character lists (they might contain the updated character)
        await this.delPattern('characters:list:*');
        await this.delPattern('characters:featured:*');
    }
    /**
     * Invalidate user-specific caches
     */
    async invalidateUserCaches(userId) {
        await this.delPattern(`characters:featured:${userId}`);
        await this.delPattern(`images:user:*`); // Conservative approach
    }
    /**
     * Invalidate image caches for a specific user/character
     */
    async invalidateImageCaches(username, characterName) {
        if (characterName) {
            await this.del(`images:user:${username}:${characterName}`);
        }
        else {
            await this.delPattern(`images:user:${username}:*`);
        }
    }
    // ===== Utility methods =====
    getCharacterListKey(mode, page, userId) {
        const baseKey = `characters:list:${mode}:${page}`;
        return userId ? `${baseKey}:${userId}` : baseKey;
    }
    isEnabled() {
        return this.config.enabled && this.redis !== null;
    }
    /**
     * Get cache performance metrics
     */
    getMetrics() {
        const hitRate = this.metrics.operations > 0
            ? (this.metrics.hits / this.metrics.operations) * 100
            : 0;
        return {
            ...this.metrics,
            hitRate: parseFloat(hitRate.toFixed(2)),
            isEnabled: this.isEnabled()
        };
    }
    /**
     * Health check for Redis connection
     */
    async healthCheck() {
        if (!this.isEnabled()) {
            return { status: 'degraded' }; // Cache disabled but app works
        }
        try {
            const start = Date.now();
            await this.redis.ping();
            const latency = Date.now() - start;
            return { status: 'healthy', latency };
        }
        catch (error) {
            console.warn('⚠️ Redis health check failed:', error);
            return { status: 'unhealthy' };
        }
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        if (this.redis) {
            try {
                await this.redis.quit();
                console.log('📋 Redis connection closed gracefully');
            }
            catch (error) {
                console.warn('⚠️ Error during Redis shutdown:', error);
            }
        }
    }
}
// Export singleton instance
export const cacheService = new CacheService();
