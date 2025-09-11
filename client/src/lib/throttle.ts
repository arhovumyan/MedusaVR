// Enhanced rate limiting system with graceful degradation
// This prevents user lockout while still managing request rates

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
  priority: 'high' | 'medium' | 'low';
}

export interface QueuedRequest {
  id: string;
  request: () => Promise<any>;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  retryCount: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

// Default configurations for different request types
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  high: { maxRequests: 10, windowMs: 1000, backoffMultiplier: 1.2, maxBackoffMs: 2000, priority: 'high' },
  medium: { maxRequests: 6, windowMs: 1000, backoffMultiplier: 1.5, maxBackoffMs: 3000, priority: 'medium' },
  low: { maxRequests: 3, windowMs: 1000, backoffMultiplier: 2, maxBackoffMs: 5000, priority: 'low' },
};

class GracefulRateLimiter {
  private requestHistory: Map<string, number[]> = new Map();
  private requestQueue: QueuedRequest[] = [];
  private processingQueue = false;
  private backoffDelays: Map<string, number> = new Map();
  private consecutiveRateLimits: Map<string, number> = new Map();

  /**
   * Execute a request with graceful rate limiting
   * Instead of blocking, it queues requests and processes them smoothly
   */
  async executeRequest<T>(
    key: string,
    request: () => Promise<T>,
    config: RateLimitConfig = DEFAULT_CONFIGS.medium
  ): Promise<T> {
    // Check if we can execute immediately
    if (this.canExecuteNow(key, config)) {
      try {
        const result = await this.executeWithBackoff(key, request, config);
        this.recordSuccess(key);
        return result;
      } catch (error: any) {
        if (error.isRateLimit) {
          // Queue the request instead of failing
          return this.queueRequest(key, request, config);
        }
        throw error;
      }
    } else {
      // Queue the request for later execution
      return this.queueRequest(key, request, config);
    }
  }

  private canExecuteNow(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const history = this.requestHistory.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = history.filter(timestamp => 
      now - timestamp < config.windowMs
    );
    
    this.requestHistory.set(key, validRequests);
    
    // Check if we're under the limit
    return validRequests.length < config.maxRequests;
  }

  private async executeWithBackoff<T>(
    key: string,
    request: () => Promise<T>,
    config: RateLimitConfig
  ): Promise<T> {
    const backoffDelay = this.backoffDelays.get(key) || 0;
    
    if (backoffDelay > 0) {
      // Show user-friendly progress indicator instead of error
      this.showProgressIndicator(key, backoffDelay);
      await this.sleep(backoffDelay);
    }

    try {
      const result = await request();
      this.recordRequestSuccess(key);
      return result;
    } catch (error: any) {
      if (error.isRateLimit) {
        this.handleRateLimit(key, config);
      }
      throw error;
    }
  }

  private queueRequest<T>(
    key: string,
    request: () => Promise<T>,
    config: RateLimitConfig
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: `${key}-${Date.now()}-${Math.random()}`,
        request,
        priority: config.priority,
        timestamp: Date.now(),
        retryCount: 0,
        resolve,
        reject
      };

      // Insert based on priority
      this.insertByPriority(queuedRequest);
      
      // Show user feedback
      this.showQueuedMessage(config.priority);
      
      // Start processing queue if not already running
      if (!this.processingQueue) {
        this.processQueue();
      }
    });
  }

  private insertByPriority(request: QueuedRequest) {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const insertIndex = this.requestQueue.findIndex(
      queuedReq => priorityOrder[queuedReq.priority] > priorityOrder[request.priority]
    );
    
    if (insertIndex === -1) {
      this.requestQueue.push(request);
    } else {
      this.requestQueue.splice(insertIndex, 0, request);
    }
  }

  private async processQueue() {
    if (this.processingQueue) return;
    
    this.processingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      
      try {
        // Small delay between queued requests to prevent overwhelming
        await this.sleep(100);
        
        const result = await request.request();
        request.resolve(result);
        this.recordRequestSuccess(request.id);
      } catch (error: any) {
        if (error.isRateLimit && request.retryCount < 3) {
          // Retry with exponential backoff
          request.retryCount++;
          await this.sleep(Math.min(1000 * Math.pow(2, request.retryCount), 5000));
          this.requestQueue.unshift(request); // Put back at front
        } else {
          request.reject(error);
        }
      }
    }
    
    this.processingQueue = false;
  }

  private handleRateLimit(key: string, config: RateLimitConfig) {
    const currentBackoff = this.backoffDelays.get(key) || 0;
    const consecutiveHits = this.consecutiveRateLimits.get(key) || 0;
    
    // Progressive backoff
    const newBackoff = Math.min(
      Math.max(currentBackoff * config.backoffMultiplier, 500),
      config.maxBackoffMs
    );
    
    this.backoffDelays.set(key, newBackoff);
    this.consecutiveRateLimits.set(key, consecutiveHits + 1);
    
    // Auto-recovery: gradually reduce backoff
    setTimeout(() => {
      const currentBackoff = this.backoffDelays.get(key) || 0;
      this.backoffDelays.set(key, Math.max(currentBackoff * 0.8, 0));
    }, config.windowMs);
  }

  private recordRequestSuccess(key: string) {
    const now = Date.now();
    const history = this.requestHistory.get(key) || [];
    history.push(now);
    this.requestHistory.set(key, history);
  }

  private recordSuccess(key: string) {
    // Reset backoff on success
    this.backoffDelays.set(key, 0);
    this.consecutiveRateLimits.set(key, 0);
  }

  private showProgressIndicator(key: string, delay: number) {
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast({
        title: "Processing...",
        description: `Please wait ${Math.ceil(delay / 1000)}s - managing request rate`,
        variant: "default"
      });
    }
  }

  private showQueuedMessage(priority: 'high' | 'medium' | 'low') {
    const messages = {
      high: "Request queued - processing shortly",
      medium: "Request queued - processing in order",
      low: "Request queued - will process when possible"
    };
    
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast({
        title: "Request Queued",
        description: messages[priority],
        variant: "default"
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get queue status for debugging
  getQueueStatus() {
    return {
      queueLength: this.requestQueue.length,
      processingQueue: this.processingQueue,
      backoffDelays: Object.fromEntries(this.backoffDelays),
      consecutiveRateLimits: Object.fromEntries(this.consecutiveRateLimits)
    };
  }
}

// Global instance
const gracefulRateLimiter = new GracefulRateLimiter();

/**
 * Enhanced throttle function that uses graceful degradation
 * @param func - The function to throttle
 * @param limit - The time interval in milliseconds
 * @param priority - Request priority level
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 500,
  priority: 'high' | 'medium' | 'low' = 'medium'
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const key = func.name || 'anonymous';
  const config = { ...DEFAULT_CONFIGS[priority], windowMs: limit };
  
  return async function (this: any, ...args: Parameters<T>) {
    return gracefulRateLimiter.executeRequest(
      key,
      () => Promise.resolve(func.apply(this, args)),
      config
    );
  };
}

/**
 * Enhanced throttle for async functions with graceful degradation
 * @param func - The async function to throttle
 * @param limit - The time interval in milliseconds
 * @param priority - Request priority level
 * @returns A throttled version of the async function
 */
export function throttleAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  limit: number = 500,
  priority: 'high' | 'medium' | 'low' = 'medium'
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const key = func.name || 'anonymous';
  const config = { ...DEFAULT_CONFIGS[priority], windowMs: limit };
  
  return async function (this: any, ...args: Parameters<T>) {
    return gracefulRateLimiter.executeRequest(
      key,
      () => func.apply(this, args),
      config
    );
  };
}

/**
 * Debounce function (unchanged - works well as-is)
 * @param func - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Enhanced button click handler with graceful rate limiting
 * @param handler - The click handler function
 * @param limit - The throttle limit in milliseconds
 * @param priority - Request priority level
 * @returns A throttled click handler
 */
export function throttleClickHandler<T extends Event>(
  handler: (event: T) => void | Promise<void>,
  limit: number = 500,
  priority: 'high' | 'medium' | 'low' = 'medium'
): (event: T) => Promise<void> {
  const throttledHandler = throttleAsync(
    async (event: T) => {
      await handler(event);
    },
    limit,
    priority
  );
  
  return async function (event: T) {
    try {
      await throttledHandler(event);
    } catch (error) {
      console.warn('Click handler error:', error);
    }
  };
}

// Export the rate limiter instance for debugging
export { gracefulRateLimiter }; 