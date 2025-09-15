/**
 * Utilities to build optimized image URLs for character cards.
 * - If the URL is a Cloudinary URL, inject a transformation for thumbnails
 * - Otherwise, return the original URL
 */

function isCloudinaryUrl(url: string): boolean {
  return /res\.cloudinary\.com\//.test(url) && /\/image\/upload\//.test(url);
}

function insertCloudinaryTransform(url: string, transform: string): string {
  // Insert the transformation segment after `/image/upload/`
  // example: https://res.cloudinary.com/<cloud>/image/upload/<transform>/<rest>
  return url.replace(/(\/image\/upload\/)(?!v\d+\/)/, `$1${transform}/`);
}

export function getOptimizedCardImageUrl(originalUrl: string | undefined, width: number): string {
  const fallback = "/fallback.jpg";
  const source = originalUrl || fallback;
  
  // Validate the source URL
  if (!source || typeof source !== 'string') return fallback;
  
  if (!isCloudinaryUrl(source)) return source;

  try {
    // Use crop fill with automatic format and quality for fast thumbnails
    const transform = `c_fill,f_auto,q_auto:eco,w_${Math.max(1, Math.floor(width))}`;
    const optimizedUrl = insertCloudinaryTransform(source, transform);
    
    // Validate the result
    if (!optimizedUrl || typeof optimizedUrl !== 'string') return source;
    
    return optimizedUrl;
  } catch (error) {
    console.warn('Error optimizing image URL:', source, error);
    return source;
  }
}

export function buildSrcSet(originalUrl: string | undefined, widths: number[]): string | undefined {
  if (!originalUrl || typeof originalUrl !== 'string') return undefined;
  
  // Filter out invalid URLs and ensure we have valid widths
  const validWidths = widths.filter(w => w > 0 && Number.isInteger(w));
  if (validWidths.length === 0) return undefined;
  
  try {
    const srcsetParts = validWidths
      .map((w) => {
        const optimizedUrl = getOptimizedCardImageUrl(originalUrl, w);
        // Only include if we got a valid URL back and it's not the fallback
        if (optimizedUrl && 
            optimizedUrl !== "/fallback.jpg" && 
            typeof optimizedUrl === 'string' &&
            optimizedUrl.length > 0 &&
            optimizedUrl.startsWith('http')) { // Ensure it's a valid HTTP URL
          return `${optimizedUrl} ${w}w`;
        }
        return null;
      })
      .filter(Boolean); // Remove null values
    
    return srcsetParts.length > 0 ? srcsetParts.join(", ") : undefined;
  } catch (error) {
    console.warn('Error building srcset for URL:', originalUrl, error);
    return undefined;
  }
}


