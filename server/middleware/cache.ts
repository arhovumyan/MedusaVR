import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/CacheService.js';

interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
  skipOnError?: boolean;
}

/**
 * Cache middleware factory for API endpoints
 */
export function createCacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = defaultKeyGenerator,
    condition = () => true,
    skipOnError = true
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests by default
    if (req.method !== 'GET') {
      return next();
    }

    // Check if caching should be applied
    if (!condition(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);
    
    try {
      // Try to get cached response
      const cachedData = await cacheService.get<any>(cacheKey);
      
      if (cachedData !== null) {
        // Cache hit - return cached data
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.json(cachedData);
      }

      // Cache miss - continue with request processing
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);

      // Intercept the response to cache it
      const originalJson = res.json;
      res.json = function(body: any) {
        // Cache the response asynchronously (don't block response)
        cacheService.set(cacheKey, body, ttl).catch(error => {
          if (!skipOnError) {
            console.warn(`⚠️ Failed to cache response for key ${cacheKey}:`, error);
          }
        });

        // Call original json method
        return originalJson.call(this, body);
      };

      next();
      
    } catch (error) {
      console.warn(`⚠️ Cache middleware error for key ${cacheKey}:`, error);
      
      if (skipOnError) {
        // Continue without caching on error
        next();
      } else {
        next(error);
      }
    }
  };
}

/**
 * Default cache key generator
 */
function defaultKeyGenerator(req: Request): string {
  const userId = (req as any).userId || 'anonymous';
  const baseKey = `api:${req.path}`;
  
  // Include query parameters in cache key
  const queryString = new URLSearchParams(req.query as any).toString();
  const fullKey = queryString ? `${baseKey}?${queryString}` : baseKey;
  
  // Include user ID for personalized content
  return `${fullKey}:user:${userId}`;
}

/**
 * Character-specific cache middleware
 */
export const characterCacheMiddleware = createCacheMiddleware({
  ttl: 300, // 5 minutes
  keyGenerator: (req: Request) => {
    const userId = (req as any).userId || 'anonymous';
    const { mode = 'all', page = '0', limit = '50', randomize = 'false' } = req.query;
    
    // Create deterministic cache key
    const params = { mode, page, limit, randomize };
    const queryString = new URLSearchParams(params as any).toString();
    
    return `characters:list:${queryString}:user:${userId}`;
  },
  condition: (req: Request) => {
    // Don't cache if randomize=true
    return req.query.randomize !== 'true';
  }
});

/**
 * Image-specific cache middleware
 */
export const imageCacheMiddleware = createCacheMiddleware({
  ttl: 900, // 15 minutes
  keyGenerator: (req: Request) => {
    const userId = (req as any).userId || 'anonymous';
    const { characterId } = req.params;
    const { page = '0', limit = '20' } = req.query;
    
    return `images:character:${characterId}:page:${page}:limit:${limit}:user:${userId}`;
  }
});

/**
 * Cache invalidation middleware for character operations
 */
export function characterInvalidationMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;
  
  res.json = function(body: any) {
    // Invalidate character caches after successful operations
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const characterId = req.params.id;
      const userId = (req as any).userId;
      
      // Async cache invalidation (don't block response)
      cacheService.invalidateCharacterCaches(characterId).catch(error => {
        console.warn('⚠️ Cache invalidation error:', error);
      });
      
      if (userId) {
        cacheService.invalidateUserCaches(userId).catch(error => {
          console.warn('⚠️ User cache invalidation error:', error);
        });
      }
    }

    return originalJson.call(this, body);
  };

  next();
}

/**
 * Cache invalidation middleware for image operations
 */
export function imageInvalidationMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;
  
  res.json = function(body: any) {
    // Invalidate image caches after successful operations
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const username = (req as any).user?.username;
      const characterName = req.body?.characterName || req.params?.characterName;
      
      if (username) {
        // Async cache invalidation (don't block response)
        cacheService.invalidateImageCaches(username, characterName).catch(error => {
          console.warn('⚠️ Image cache invalidation error:', error);
        });
      }
    }

    return originalJson.call(this, body);
  };

  next();
}

/**
 * Cache metrics endpoint middleware
 */
export function cacheMetricsMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const metrics = cacheService.getMetrics();
    res.json({
      cache: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.warn('⚠️ Cache metrics error:', error);
    res.status(500).json({ error: 'Failed to retrieve cache metrics' });
  }
}

/**
 * Cache health check middleware
 */
export async function cacheHealthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const health = await cacheService.healthCheck();
    res.json({
      cache: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.warn('⚠️ Cache health check error:', error);
    res.status(500).json({ error: 'Cache health check failed' });
  }
}
