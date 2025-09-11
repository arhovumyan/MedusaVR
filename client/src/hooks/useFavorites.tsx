// Favorites context and hooks
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { useAuth } from './useAuth';
import { useSubscriptionModal } from './useSubscriptionModal';
import type { Character } from '@shared/api-types';

interface FavoritesContextType {
  favorites: Character[];
  isLoading: boolean;
  addToFavorites: (character: Character) => Promise<void>;
  removeFromFavorites: (characterId: string) => Promise<void>;
  isFavorite: (characterId: string) => boolean;
  toggleFavorite: (character: Character) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const { showSubscriptionModal } = useSubscriptionModal();
  const queryClient = useQueryClient();
  const [localFavorites, setLocalFavorites] = useState<Character[]>([]);

  // Query to fetch favorites from backend
  const { data: backendFavorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: apiService.getFavorites,
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Convert backend favorites to frontend Character format
  const favorites: Character[] = backendFavorites.map((char: any) => ({
    id: char.id,
    name: char.name,
    persona: char.persona || char.description || '',
    description: char.description,
    avatar: char.avatar,
    avatarUrl: char.avatarUrl,
    isUserCreated: char.isUserCreated || false,
    nsfw: char.nsfw,
    chatCount: char.chatCount,
    selectedTags: char.selectedTags,
    tags: char.tags,
    tagNames: char.tagNames,
    rating: char.rating,
  }));

  // Fallback to localStorage for unauthenticated users (backward compatibility)
  useEffect(() => {
    if (!isAuthenticated) {
      const savedFavorites = localStorage.getItem('medusavr-favorites');
      if (savedFavorites) {
        try {
          const parsedFavorites = JSON.parse(savedFavorites);
          setLocalFavorites(parsedFavorites);
        } catch (error) {
          console.error('Error loading favorites from localStorage:', error);
        }
      }
    }
  }, [isAuthenticated]);

  // Save to localStorage for unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('medusavr-favorites', JSON.stringify(localFavorites));
    }
  }, [localFavorites, isAuthenticated]);

  // Mutations for authenticated users
  const addFavoriteMutation = useMutation({
    mutationFn: (characterId: string) => apiService.addFavorite(parseInt(characterId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (characterId: string) => apiService.removeFavorite(parseInt(characterId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (characterId: string) => apiService.toggleFavorite(parseInt(characterId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const addToFavorites = async (character: Character) => {
    if (isAuthenticated && user) {
      await addFavoriteMutation.mutateAsync(character.id);
    } else {
      showSubscriptionModal(`add ${character.name} to your favorites`);
    }
  };

  const removeFromFavorites = async (characterId: string) => {
    if (isAuthenticated && user) {
      await removeFavoriteMutation.mutateAsync(characterId);
    } else {
      showSubscriptionModal('manage your favorites');
    }
  };

  const isFavorite = (characterId: string): boolean => {
    const currentFavorites = isAuthenticated ? favorites : localFavorites;
    return currentFavorites.some(fav => fav.id === characterId);
  };

  const toggleFavorite = async (character: Character) => {
    if (isAuthenticated && user) {
      await toggleFavoriteMutation.mutateAsync(character.id);
    } else {
      // Show subscription modal for unauthenticated users
      showSubscriptionModal(`add ${character.name} to your favorites`);
    }
  };

  const value: FavoritesContextType = {
    favorites: isAuthenticated ? favorites : localFavorites,
    isLoading: isAuthenticated ? isLoading : false,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
