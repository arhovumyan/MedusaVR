// Performance monitoring utilities

export const measurePageLoad = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const metrics = {
      // Time to First Byte
      ttfb: navigation.responseStart - navigation.fetchStart,
      
      // DOM Content Loaded
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      
      // Load Complete
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // Total page load time
      totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      
      // DNS lookup time
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      
      // TCP connection time
      tcpConnection: navigation.connectEnd - navigation.connectStart,
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.table(metrics);
    }
    
    return metrics;
  }
  
  return null;
};

export const measureComponentRender = (componentName: string) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    }
    
    return renderTime;
  };
};

// Web Vitals measurements
export const observeWebVitals = () => {
  if (typeof window === 'undefined') return;
  
  // Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (process.env.NODE_ENV === 'development') {
          console.log('LCP:', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as any; // Type assertion for FID entries
          if (process.env.NODE_ENV === 'development') {
            console.log('FID:', fidEntry.processingStart - fidEntry.startTime);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }
};

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof window === 'undefined') return;
  
  // Get the correct API base URL
  const getApiBaseUrl = (): string => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isLocalhost) {
      return 'http://localhost:5002';
    }
    
    // For production, use relative URLs
    return '';
  };
  
  const apiBaseUrl = getApiBaseUrl();
  
  // Note: API endpoint preloading is disabled due to CORS restrictions
  // The API calls will be made when needed by the components
};
