import React, { memo, useCallback, useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Heart, MessageCircle } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { apiRequest } from "@/lib/queryClient";
import type { Character } from "@shared/api-types";
import { useImageBlur } from "@/context/ImageBlurContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { buildSrcSet, getOptimizedCardImageUrl } from "@/lib/imageUrl";

// Enhanced Character Card with performance optimizations
const CharacterCard = memo(({
  char,
  isCharacterFavorite,
  onFavoriteClick,
  isBlurred,
  shouldBlurNSFW,
  disableHoverScale = false,
  fetchPriority = 'auto'
}: {
  char: Character;
  isCharacterFavorite: boolean;
  onFavoriteClick: (e: React.MouseEvent, character: Character) => void;
  isBlurred: boolean;
  shouldBlurNSFW: (isNSFW: boolean) => boolean;
  disableHoverScale?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(320);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setContainerWidth(el.clientWidth || 320);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Preload image for better performance
  useEffect(() => {
    const imageUrl = getOptimizedCardImageUrl(char.avatar, Math.min(512, containerWidth * 1.5));
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true); // Still show something even if image fails
    img.src = imageUrl;
    imageRef.current = img;
  }, [char.avatar, containerWidth]);
  
  return (
    <Link
      to={`/characters/${char.id}`}
      key={char.id}
      className="block"
      onClick={() => console.log(`Navigating to character ${char.id}`)}
    >
      <div ref={containerRef} className={`character-card responsive-character-card relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 ease-in-out group ${
        disableHoverScale ? '' : 'hover:scale-105'
      }`}>
        {/* Skeleton background while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 animate-pulse" />
        )}
        
        <img
          src={getOptimizedCardImageUrl(char.avatar, Math.min(512, containerWidth * 1.5))}
          alt={char.name}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ease-out ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            filter: shouldBlurNSFW(char.nsfw || false) ? 'blur(20px)' : undefined,
            opacity: shouldBlurNSFW(char.nsfw || false) ? 0.6 : undefined
          }}
          loading={fetchPriority === 'high' ? 'eager' : 'lazy'}
          decoding="async"
          fetchpriority={fetchPriority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
          {...(buildSrcSet(char.avatar, [240, 360, 480, 640]) && { srcSet: buildSrcSet(char.avatar, [240, 360, 480, 640]) })}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/fallback.jpg";
            setImageLoaded(true);
          }}
        />
        
        {/* Heart Button - Top Right */}
        <button
          onClick={(e) => onFavoriteClick(e, char)}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 z-10 opacity-100"
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isCharacterFavorite 
                ? 'text-red-500 fill-red-500' 
                : 'text-white hover:text-red-400'
            }`} 
          />
        </button>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 text-white">
          {/* Character Name */}
          <h3 className="text-base font-semibold mb-2 truncate">{char.name}</h3>
          
          {/* Description */}
          <p className="text-xs mb-3 line-clamp-2 leading-tight opacity-90">
            {char.description}
          </p>
          
          {/* Chat and Word Count Statistics */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle className="w-4 h-4 text-white/80 mr-1" />
              <span className="text-sm font-medium">
                {(char as any).totalWords ? (
                  (char as any).totalWords > 1000 
                    ? `${((char as any).totalWords / 1000).toFixed(1)}K` 
                    : (char as any).totalWords.toLocaleString()
                ) : (char.chatCount ? (char.chatCount > 1000 
                  ? `${(char.chatCount / 1000).toFixed(1)}K` 
                  : char.chatCount.toLocaleString()
                ) : '0')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

// Skeleton card for loading states
const SkeletonCard = memo(() => (
  <div className="character-card responsive-character-card relative overflow-hidden rounded-lg shadow-lg">
    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 animate-pulse">
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3">
        <div className="h-4 bg-zinc-600 rounded mb-2 animate-pulse"></div>
        <div className="h-3 bg-zinc-700 rounded mb-2 animate-pulse"></div>
        <div className="h-3 bg-zinc-700 rounded w-3/4 animate-pulse"></div>
      </div>
    </div>
  </div>
));

interface CardsProps {
  mode?: 'all' | 'featured' | 'discover'; // New prop for API mode
  limit?: number;
  randomize?: boolean;
  onLoadMore?: () => void;
  showLoadMoreButton?: boolean;
  prioritizeUserPreferences?: boolean;
  singleRowOnly?: boolean;
  externalCharacters?: Character[]; // New prop for external characters data
  externalLoading?: boolean; // New prop for external loading state
  externalError?: any; // New prop for external error state
  pageSize?: number; // Page size for discover mode
}

const Cards: React.FC<CardsProps> = ({ 
  mode = 'all',
  limit, 
  randomize = false, 
  onLoadMore, 
  showLoadMoreButton = false,
  prioritizeUserPreferences = false,
  singleRowOnly = false,
  externalCharacters,
  externalLoading = false,
  externalError = null,
  pageSize = 40
}: CardsProps) => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [allLoadedCharacters, setAllLoadedCharacters] = useState<Character[]>([]);
  
  // Fetch word statistics for all characters with timeout handling
  const { data: wordStats, error: wordStatsError } = useQuery({
    queryKey: ['word-stats-all'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/word-stats/all-characters', undefined, {}, 'low');
        const result = await response.json();
        return result.success ? result.wordStats : {};
      } catch (error: any) {
        console.warn('⚠️ Word stats fetch failed:', error);
        // Return empty object on error to prevent UI issues
        return {};
      }
    },
    staleTime: 300000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on timeout errors to prevent overwhelming the server
      if (error?.status === 408 || error?.status === 504) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 5000, // Wait 5 seconds before retrying
  });
  
  // Use React Query only if external characters are not provided
  const { data: characters, error, isLoading, refetch } = useQuery({
    queryKey: ['characters', mode, limit, pageSize, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Set mode-specific parameters
      if (mode !== 'all') {
        params.append('mode', mode);
      }
      
      if (mode === 'discover') {
        params.append('page', currentPage.toString());
        params.append('pageSize', pageSize.toString());
      } else {
        if (randomize) params.append('randomize', 'true');
        if (limit) params.append('limit', limit.toString());
      }
      
      const url = `/api/characters${params.toString() ? '?' + params.toString() : ''}`;
      console.log(`🔍 Fetching ${mode} characters:`, url);
      
      const response = await apiRequest('GET', url, undefined, {}, 'low');
      
      // Check for pagination reset
      const paginationReset = response.headers.get('X-Pagination-Reset') === 'true';
      const responseHasMore = response.headers.get('X-Has-More') === 'true';
      
      if (paginationReset) {
        console.log('🔄 Pagination reset detected, starting over');
        setCurrentPage(0);
        setAllLoadedCharacters([]);
      }
      
      setHasMore(responseHasMore);
      
      const newCharacters = await response.json() as Character[];
      
      // For discover mode, accumulate characters across pages
      if (mode === 'discover' && !paginationReset) {
        setAllLoadedCharacters(prev => {
          // Avoid duplicates by filtering out characters already in the list
          const existingIds = new Set(prev.map(char => char.id));
          const uniqueNewChars = newCharacters.filter(char => !existingIds.has(char.id));
          return [...prev, ...uniqueNewChars];
        });
      } else if (mode === 'discover' && paginationReset) {
        // Reset for new cycle
        setAllLoadedCharacters(newCharacters);
      }
      
      return newCharacters;
    },
    staleTime: randomize || mode === 'discover' ? 0 : 600000, // 10 minutes cache for non-randomized requests (server has Redis cache)
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error: any) => {
      if (error?.isRateLimit) {
        return false;
      }
      return failureCount < 2;
    },
    enabled: !externalCharacters // Only fetch if external characters not provided
  });

  // Use external data if provided, otherwise use query data or accumulated data
  const finalCharacters = externalCharacters || 
    (mode === 'discover' ? allLoadedCharacters : characters) || [];
  const finalLoading = externalCharacters ? externalLoading : isLoading;
  const finalError = externalCharacters ? externalError : error;

  const { isFavorite, toggleFavorite } = useFavorites();
  const { isBlurred, shouldBlurNSFW } = useImageBlur();
  
  // Handle load more for discover mode
  const handleLoadMore = useCallback(() => {
    if (mode === 'discover' && hasMore) {
      setCurrentPage(prev => prev + 1);
    } else if (mode === 'discover' && !hasMore) {
      // Reset pagination when no more characters
      console.log('🔄 No more characters, resetting pagination');
      setCurrentPage(0);
      setAllLoadedCharacters([]);
      refetch();
    } else {
      // For other modes, trigger refetch
      refetch();
    }
    
    // Also call the provided onLoadMore callback
    if (onLoadMore) {
      onLoadMore();
    }
  }, [mode, hasMore, onLoadMore, refetch]);
  
  // Helper function to calculate preference match score
  const getPreferenceMatchScore = React.useCallback((character: Character, userTags: string[]) => {
    if (!userTags || userTags.length === 0) {
      return 0;
    }
    
    let score = 0;
    
    // Check tagNames property if it exists
    if (character.tagNames && Array.isArray(character.tagNames)) {
      character.tagNames.forEach((tag: string) => {
        if (userTags.includes(tag)) {
          score += 1;
        }
      });

  // Prefetch next page in discover mode after current page loads
  useEffect(() => {
    if (mode !== 'discover') return;
    if (!characters || characters.length === 0) return;
    if (!hasMore) return;
    const nextPage = currentPage + 1;
    const params = new URLSearchParams();
    params.append('mode', 'discover');
    params.append('page', String(nextPage));
    params.append('pageSize', String(pageSize));
    const nextUrl = `/api/characters?${params.toString()}`;
    // Fire and forget low-priority prefetch
    apiRequest('GET', nextUrl, undefined, {}, 'low').catch(() => {});
  }, [mode, characters, hasMore, currentPage, pageSize]);
    }
    
    return score;
  }, []);

  // Memoize filtered characters with word stats
  const filteredCharacters = React.useMemo(() => {
    if (!finalCharacters) return [];
    
    let result = [...finalCharacters];
    
    // Merge word statistics with character data
    if (wordStats) {
      result = result.map(char => ({
        ...char,
        totalWords: wordStats[char.id]?.totalWords || 0,
        userWords: wordStats[char.id]?.userWords || 0,
        characterWords: wordStats[char.id]?.characterWords || 0
      }));
    }
    
    // For featured mode, characters are already filtered by backend
    // For other modes, apply client-side filtering if needed
    if (mode !== 'featured' && prioritizeUserPreferences && user?.preferences?.selectedTags) {
      const userPreferenceTags = user.preferences.selectedTags || [];
      
      // Sort characters by preference match score (higher score = more matches)
      result = result.sort((a, b) => {
        const aScore = getPreferenceMatchScore(a, userPreferenceTags);
        const bScore = getPreferenceMatchScore(b, userPreferenceTags);
        return bScore - aScore; // Higher score first
      });
    } else if (randomize && mode !== 'discover') {
      // Only randomize if not in discover mode (discover mode handles randomization on backend)
      result = result.sort(() => Math.random() - 0.5);
    }
    
    // Apply limit if specified (except for discover mode which handles pagination)
    if (limit && limit > 0 && mode !== 'discover') {
      result = result.slice(0, limit);
    }
    
    return result;
  }, [finalCharacters, randomize, limit, prioritizeUserPreferences, user?.preferences?.selectedTags, getPreferenceMatchScore, mode, wordStats]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent, character: Character) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(character);
  }, [toggleFavorite]);

  if (finalError) {
    return (
      <div className="text-center p-4">
        <div className="text-red-400 mb-2">Failed to load characters</div>
        <div className="text-sm text-gray-400">
          {finalError?.isRateLimit 
            ? "Loading... please wait a moment" 
            : finalError.message || "Please try refreshing the page"
          }
        </div>
      </div>
    );
  }
  
  if (finalLoading) {
    return (
      <div className="px-0 w-full">
        <div className="card-container responsive-character-grid w-full">
          {Array.from({ length: (singleRowOnly ? 6 : (limit || 12)) }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-0 w-full">
      <div className={singleRowOnly 
        ? "flex gap-4 overflow-x-auto scrollbar-hide pb-2 overscroll-x-contain" 
        : "card-container responsive-character-grid w-full"
      }
      style={singleRowOnly ? { touchAction: 'pan-x pan-y' } : undefined}
      >
        {filteredCharacters.map((char, index) => {
          const isCharacterFavorite = isFavorite(char.id);
          // Prioritize fetch for the first few images above the fold
          const priority: 'high' | 'low' | 'auto' = index < 6 ? 'high' : 'auto';
          
          return (
            <div key={char.id} className={singleRowOnly ? "flex-shrink-0" : ""}>
              <CharacterCard
                char={char}
                isCharacterFavorite={isCharacterFavorite}
                onFavoriteClick={handleFavoriteClick}
                isBlurred={isBlurred}
                shouldBlurNSFW={shouldBlurNSFW}
                disableHoverScale={singleRowOnly}
                fetchPriority={priority}
              />
            </div>
          );
        })}
      </div>
      
      {/* Load More Button */}
      {showLoadMoreButton && (
        <div className="mt-8 text-center">
          {mode === 'discover' && !hasMore ? (
            // Show reset button when we've run out of characters in discover mode
            <Button
              onClick={handleLoadMore}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Start Over - Discover More Characters
            </Button>
          ) : filteredCharacters.length > 0 ? (
            // Normal load more button
            <Button
              onClick={handleLoadMore}
              disabled={finalLoading}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg shadow-orange-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${finalLoading ? 'animate-spin' : ''}`} />
              {mode === 'discover' ? 'Load More Characters' : 'Refresh Characters'}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default memo(Cards);