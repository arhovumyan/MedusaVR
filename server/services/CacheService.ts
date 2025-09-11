import Redis from 'ioredis';
import type { ICharacter } from '../db/models/CharacterModel.js';

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  enabled: boolean;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  operations: number;
  errors: number;
}

export class CacheService {
  private redis: Redis | null = null;
  private config: CacheConfig;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    operations: 0,
    errors: 0
  };

  // TTL strategies (in seconds)
  private readonly TTL = {
    CHARACTER_LIST: 300,      // 5 minutes
    CHARACTER_DETAIL: 600,    // 10 minutes
    FEATURED_CHARS: 180,      // 3 minutes
    IMAGE_METADATA: 900,      // 15 minutes
    GENERATION_RESULT: 3600,  // 1 hour
    USER_PREFERENCES: 1800    // 30 minutes
  };

  constructor() {
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
    } else {
      console.log('Cache disabled - app will run without Redis caching');
    }
  }

  private initializeRedis() {
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

    } catch (error) {
      console.warn('Redis initialization failed, caching disabled:', error);
      this.config.enabled = false;
    }
  }

  /**
   * Generic get method with automatic JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled()) return null;

    try {
      this.metrics.operations++;
      const value = await this.redis!.get(key);
      
      if (value === null) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn(`Cache GET error for key ${key}:`, error);
      this.metrics.errors++;
      return null;
    }
  }

  /**
   * Generic set method with automatic JSON serialization and TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      this.metrics.operations++;
      const serialized = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.redis!.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis!.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      console.warn(`Cache SET error for key ${key}:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Delete a cache key
   */
  async del(key: string): Promise<boolean> {
    if (!this.isEnabled()) return false;

    try {
      this.metrics.operations++;
      await this.redis!.del(key);
      return true;
    } catch (error) {
      console.warn(`⚠️ Cache DEL error for key ${key}:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.isEnabled()) return 0;

    try {
      this.metrics.operations++;
      const keys = await this.redis!.keys(pattern);
      if (keys.length === 0) return 0;
      
      const deletedCount = await this.redis!.del(...keys);
      return deletedCount;
    } catch (error) {
      console.warn(`⚠️ Cache DEL pattern error for ${pattern}:`, error);
      this.metrics.errors++;
      return 0;
    }
  }

  // ===== Character-specific cache methods =====

  /**
   * Cache character list with smart key generation
   */
  async cacheCharacterList(
    characters: ICharacter[], 
    mode: string, 
    page: number, 
    userId?: string
  ): Promise<void> {
    const key = this.getCharacterListKey(mode, page, userId);
    await this.set(key, characters, this.TTL.CHARACTER_LIST);
  }

  /**
   * Get cached character list
   */
  async getCharacterList(
    mode: string, 
    page: number, 
    userId?: string
  ): Promise<ICharacter[] | null> {
    const key = this.getCharacterListKey(mode, page, userId);
    return await this.get<ICharacter[]>(key);
  }

  /**
   * Cache individual character details
   */
  async cacheCharacter(character: ICharacter): Promise<void> {
    const key = `characters:detail:${character.id}`;
    await this.set(key, character, this.TTL.CHARACTER_DETAIL);
  }

  /**
   * Get cached character details
   */
  async getCharacter(id: string | number): Promise<ICharacter | null> {
    const key = `characters:detail:${id}`;
    return await this.get<ICharacter>(key);
  }

  /**
   * Cache featured characters for a user
   */
  async cacheFeaturedCharacters(characters: ICharacter[], userId: string): Promise<void> {
    const key = `characters:featured:${userId}`;
    await this.set(key, characters, this.TTL.FEATURED_CHARS);
  }

  /**
   * Get cached featured characters
   */
  async getFeaturedCharacters(userId: string): Promise<ICharacter[] | null> {
    const key = `characters:featured:${userId}`;
    return await this.get<ICharacter[]>(key);
  }

  /**
   * Cache user's generated images metadata
   */
  async cacheUserImages(username: string, characterName: string, images: any[]): Promise<void> {
    const key = `images:user:${username}:${characterName}`;
    await this.set(key, images, this.TTL.IMAGE_METADATA);
  }

  /**
   * Get cached user images metadata
   */
  async getUserImages(username: string, characterName: string): Promise<any[] | null> {
    const key = `images:user:${username}:${characterName}`;
    return await this.get<any[]>(key);
  }

  /**
   * Cache image generation result
   */
  async cacheGenerationResult(jobId: string, result: any): Promise<void> {
    const key = `images:generation:${jobId}`;
    await this.set(key, result, this.TTL.GENERATION_RESULT);
  }

  /**
   * Get cached generation result
   */
  async getGenerationResult(jobId: string): Promise<any | null> {
    const key = `images:generation:${jobId}`;
    return await this.get<any>(key);
  }

  // ===== Cache invalidation methods =====

  /**
   * Invalidate all character-related caches
   */
  async invalidateCharacterCaches(characterId?: string | number): Promise<void> {
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
  async invalidateUserCaches(userId: string): Promise<void> {
    await this.delPattern(`characters:featured:${userId}`);
    await this.delPattern(`images:user:*`); // Conservative approach
  }

  /**
   * Invalidate image caches for a specific user/character
   */
  async invalidateImageCaches(username: string, characterName?: string): Promise<void> {
    if (characterName) {
      await this.del(`images:user:${username}:${characterName}`);
    } else {
      await this.delPattern(`images:user:${username}:*`);
    }
  }

  // ===== Utility methods =====

  private getCharacterListKey(mode: string, page: number, userId?: string): string {
    const baseKey = `characters:list:${mode}:${page}`;
    return userId ? `${baseKey}:${userId}` : baseKey;
  }

  private isEnabled(): boolean {
    return this.config.enabled && this.redis !== null;
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): CacheMetrics & { hitRate: number; isEnabled: boolean } {
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
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; latency?: number }> {
    if (!this.isEnabled()) {
      return { status: 'degraded' }; // Cache disabled but app works
    }

    try {
      const start = Date.now();
      await this.redis!.ping();
      const latency = Date.now() - start;
      
      return { status: 'healthy', latency };
    } catch (error) {
      console.warn('⚠️ Redis health check failed:', error);
      return { status: 'unhealthy' };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
        console.log('📋 Redis connection closed gracefully');
      } catch (error) {
        console.warn('⚠️ Error during Redis shutdown:', error);
      }
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
