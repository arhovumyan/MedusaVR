import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { useAuth } from './useAuth';
import { useSubscriptionModal } from './useSubscriptionModal';
import { apiRequest } from '@/lib/queryClient';

interface LikesContextType {
  likedCharacters: number[];
  isLoading: boolean;
  isLiked: (characterId: number) => boolean;
  toggleLike: (characterId: number) => Promise<{ likes: number; isLiked: boolean } | null>;
}

const LikesContext = createContext<LikesContextType | undefined>(undefined);

export function useLikes() {
  const context = useContext(LikesContext);
  if (!context) {
    throw new Error('useLikes must be used within a LikesProvider');
  }
  return context;
}

interface LikesProviderProps {
  children: ReactNode;
}

export function LikesProvider({ children }: LikesProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const { showSubscriptionModal } = useSubscriptionModal();
  const queryClient = useQueryClient();
  const [localLikedCharacters, setLocalLikedCharacters] = useState<number[]>([]);
  const [isToggling, setIsToggling] = useState(false);

  // Query to fetch liked characters from backend
  const { data: backendLikedCharacters = [], isLoading } = useQuery({
    queryKey: ['likedCharacters', user?.id],
    queryFn: () => apiService.getLikedCharacters(user?.id!),
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fallback to localStorage for unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      const savedLikes = localStorage.getItem('medusavr-liked-characters');
      if (savedLikes) {
        try {
          const parsedLikes = JSON.parse(savedLikes);
          setLocalLikedCharacters(parsedLikes);
        } catch (error) {
          console.error('Error loading liked characters from localStorage:', error);
        }
      }
    }
  }, [isAuthenticated]);

  // Save to localStorage for unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('medusavr-liked-characters', JSON.stringify(localLikedCharacters));
    }
  }, [localLikedCharacters, isAuthenticated]);

  // Enhanced toggle like function with graceful rate limiting
  const toggleLike = async (characterId: number): Promise<{ likes: number; isLiked: boolean } | null> => {
    if (isToggling) {
      console.info('Like toggle already in progress, skipping...');
      return null;
    }

    setIsToggling(true);
    
    try {
      if (isAuthenticated && user) {
        // Use graceful rate limiting for authenticated users
        const response = await apiRequest(
          'PUT', 
          `/api/characters/${characterId}/likes`,
          {},
          {},
          'high' // High priority for user interactions
        );
        
        if (response.ok) {
          const data = await response.json();
          
          // Update cache immediately for better UX
          queryClient.setQueryData(['likedCharacters', user.id], (old: number[] = []) => {
            if (data.isLiked) {
              return [...old, characterId];
            } else {
              return old.filter(id => id !== characterId);
            }
          });

          // Invalidate related queries for consistency
          queryClient.invalidateQueries({ queryKey: ['character', characterId.toString()] });
          queryClient.invalidateQueries({ queryKey: ['characters'] });
          
          return {
            likes: data.likes,
            isLiked: data.isLiked
          };
        } else {
          const errorData = await response.json();
          console.error('Toggle like failed:', errorData);
          return null;
        }
      } else {
        // Handle unauthenticated users with local storage
        const currentLikedCharacters = localLikedCharacters;
        const isCurrentlyLiked = currentLikedCharacters.includes(characterId);
        
        if (isCurrentlyLiked) {
          setLocalLikedCharacters(prev => prev.filter(id => id !== characterId));
        } else {
          setLocalLikedCharacters(prev => [...prev, characterId]);
        }
        
        return {
          likes: 0, // We don't have actual like counts for unauthenticated users
          isLiked: !isCurrentlyLiked
        };
      }
    } catch (error: any) {
      // The graceful rate limiter will handle rate limit errors gracefully
      // Only log other types of errors
      if (!error?.isRateLimit) {
        console.error('Failed to toggle like:', error);
      }
      return null;
    } finally {
      setIsToggling(false);
    }
  };

  const isLiked = (characterId: number): boolean => {
    const currentLikedCharacters = isAuthenticated ? backendLikedCharacters : localLikedCharacters;
    return currentLikedCharacters.includes(characterId);
  };

  const value: LikesContextType = {
    likedCharacters: isAuthenticated ? backendLikedCharacters : localLikedCharacters,
    isLoading: isAuthenticated ? isLoading || isToggling : isToggling,
    isLiked,
    toggleLike,
  };

  return (
    <LikesContext.Provider value={value}>
      {children}
    </LikesContext.Provider>
  );
}