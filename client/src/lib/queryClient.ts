import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { gracefulRateLimiter } from "./throttle";

// Function to determine the correct API base URL
function getApiBaseUrl(): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development';
  
  // If we have a VITE_API_URL environment variable, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // For local development (running with npm run dev)
  if (isLocalhost && isDevelopment) {
    // Use relative URL to leverage Vite proxy
    return '';
  }
  
  // For production on Vercel, use the Railway backend URL
  if (hostname.includes('vercel.app') || hostname.includes('medusa-vrfriendly.vercel.app')) {
    return 'https://medusavr-production.up.railway.app';
  }
  
  // For Docker environments or production, use relative URLs
  // The nginx proxy will handle forwarding /api/ to the backend
  return '';
}

// Single source of truth for your API base URL
const BASE_URL = getApiBaseUrl();

// Debug logging - only in development
if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol,
    BASE_URL,
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
    DEV: import.meta.env.DEV,
    VITE_API_URL: import.meta.env.VITE_API_URL
  });
}

/**
 * Enhanced error handling that provides graceful degradation
 * instead of completely blocking users
 */
async function handleResponseErrors(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;

    if (
      res.status === 401 &&
      (text.includes("Invalid or expired token") ||
       text.includes("invalid signature"))
    ) {
      console.warn("🔒 JWT error detected, clearing tokens and refreshing page");
      localStorage.removeItem("medusavr_access_token");
      localStorage.removeItem("medusavr_refresh_token");
      localStorage.removeItem("medusavr_user");
      window.location.reload();
    }

    if (res.status === 429) {
      // Create a rate limit error that can be handled gracefully
      const rateLimitError = new Error(`Rate limit exceeded`) as any;
      rateLimitError.isRateLimit = true;
      rateLimitError.originalResponse = res;
      rateLimitError.status = 429;
      
      // Don't show error toast - let the graceful rate limiter handle it
      console.info("⏳ Rate limit encountered - request will be queued");
      
      throw rateLimitError;
    }

    // For other errors, create a proper error object
    const error = new Error(`${res.status}: ${text}`) as any;
    error.status = res.status;
    error.response = res;
    throw error;
  }
}

/**
 * Enhanced API request function with graceful rate limiting
 * Uses the new graceful rate limiter to prevent user lockout
 */
export async function apiRequest(
  method: string,
  url: string,
  body?: any,
  headers: Record<string,string> = {},
  priority: 'high' | 'medium' | 'low' = 'medium'
): Promise<Response> {
  const fullURL = `${BASE_URL}${url}`;
  const token = localStorage.getItem("medusavr_access_token");
  
  const options: RequestInit = {
    method,
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  // Handle different body types
  if (body !== undefined) {
    if (body instanceof FormData) {
      // For FormData, let the browser set the Content-Type with boundary
      options.body = body;
    } else {
      // For other types, use JSON
      options.headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };
      options.body = JSON.stringify(body);
    }
  } else {
    // For requests without body, set JSON content type
    options.headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
  }

  // Use graceful rate limiter for the request
  const requestKey = `${method}-${url}`;
  
  const response = await gracefulRateLimiter.executeRequest(
    requestKey,
    async () => {
      const res = await fetch(fullURL, options);
      await handleResponseErrors(res);
      return res;
    },
    {
      maxRequests: priority === 'high' ? 10 : priority === 'medium' ? 6 : 3,
      windowMs: 1000,
      backoffMultiplier: priority === 'high' ? 1.2 : priority === 'medium' ? 1.5 : 2,
      maxBackoffMs: priority === 'high' ? 2000 : priority === 'medium' ? 3000 : 5000,
      priority
    }
  );

  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Enhanced query function with graceful rate limiting
 * Prevents user lockout while maintaining performance
 */
export const getQueryFn = <T>({
  on401: unauthorizedBehavior,
  priority = 'medium'
}: {
  on401: UnauthorizedBehavior;
  priority?: 'high' | 'medium' | 'low';
}): QueryFunction<T> => {
  return async ({ queryKey }) => {
    const endpoint = queryKey[0] as string;
    const fullURL = `${BASE_URL}${endpoint}`;
    const token = localStorage.getItem("medusavr_access_token");
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const requestKey = `GET-${endpoint}`;
    
    const response = await gracefulRateLimiter.executeRequest(
      requestKey,
      async () => {
        const res = await fetch(fullURL, {
          headers,
          credentials: "include",
        });

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }

        await handleResponseErrors(res);
        return res.json();
      },
      {
        maxRequests: priority === 'high' ? 10 : priority === 'medium' ? 6 : 3,
        windowMs: 1000,
        backoffMultiplier: priority === 'high' ? 1.2 : priority === 'medium' ? 1.5 : 2,
        maxBackoffMs: priority === 'high' ? 2000 : priority === 'medium' ? 3000 : 5000,
        priority
      }
    );

    return response;
  };
};

/**
 * Enhanced query client with better error handling and recovery
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw", priority: 'medium' }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // Disable automatic reconnect refetch
      staleTime: 5 * 60_000,  // 5 minutes
      retry: (failureCount, error: any) => {
        // Never retry rate limit errors - they're handled by the graceful rate limiter
        if (error?.isRateLimit || error?.status === 429) {
          return false;
        }
        
        // Don't retry 4xx errors (client errors) except 408 (timeout)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 408) {
          return false;
        }
        
        // Only retry network errors and 5xx errors, but be very conservative
        return failureCount < 1; // Max 1 retry instead of 3
      },
      retryDelay: attemptIndex => {
        // Much longer delays to avoid compounding rate limit issues
        const baseDelay = Math.min(3000 * 2 ** attemptIndex, 30_000);
        const jitter = Math.random() * 0.3 * baseDelay;
        return baseDelay + jitter;
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Never retry rate limit errors for mutations
        if (error?.isRateLimit || error?.status === 429) {
          return false;
        }
        
        // Don't retry client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        
        // Never retry mutations - they should be idempotent or user-initiated
        return false;
      },
    },
  },
});

// Global error handler for uncaught promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.isRateLimit) {
      // Prevent default error handling for rate limit errors
      event.preventDefault();
      console.info('⏳ Rate limit error handled gracefully');
    }
  });
}

// Export debug function for monitoring rate limiting
export function getRateLimitStatus() {
  return gracefulRateLimiter.getQueueStatus();
}

// Debug utility to test rate limiting behavior - only available in development
export function testRateLimiting() {
  if (import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') {
    console.log('🧪 Testing rate limiting system...');
    
    // Test rapid API calls
    const testCalls = Array.from({ length: 20 }, (_, i) => 
      apiRequest('GET', '/api/characters', undefined, {}, 'medium')
        .then(() => console.log(`✅ Test call ${i + 1} succeeded`))
        .catch(error => {
          if (error.isRateLimit) {
            console.log(`⏳ Test call ${i + 1} queued (rate limited)`);
          } else {
            console.log(`❌ Test call ${i + 1} failed:`, error.message);
          }
        })
    );
    
    // Monitor queue status
    const monitor = setInterval(() => {
      const status = getRateLimitStatus();
      if (status.queueLength > 0 || status.processingQueue) {
        console.log('📊 Rate Limit Status:', status);
      } else {
        console.log('✅ Rate limiting test completed');
        clearInterval(monitor);
      }
    }, 500);
    
    // Auto-clear monitor after 30 seconds
    setTimeout(() => {
      clearInterval(monitor);
      console.log('🔚 Rate limiting test monitor stopped');
    }, 30000);
  }
}

// Add to window for debugging in browser console
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testRateLimiting = testRateLimiting;
  (window as any).getRateLimitStatus = getRateLimitStatus;
}
