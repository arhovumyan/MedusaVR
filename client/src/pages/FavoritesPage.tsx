import React, { useMemo, useCallback, memo } from 'react'
import { Heart, MessageCircle } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import { useImageBlur } from '@/context/ImageBlurContext'
import { Link } from 'wouter'
import Cards from '@/components/ui/cards'

// Import the same type as cards.tsx uses
import type { Character } from "@/constants";

const FavoritesPage = () => {
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { isBlurred, shouldBlurNSFW } = useImageBlur();

  // Don't filter out NSFW characters - they will be blurred instead
  const filteredFavorites = useMemo(() => {
    return favorites; // Show all favorites, blurring will be handled in rendering
  }, [favorites]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent, character: Character) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    toggleFavorite(character);
  }, [toggleFavorite]);

  return (
    <div className='text-white'>
      <div className="max-w-6xl mx-auto px-4 lg:px-0">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-4">
            Favorites
          </h1>
          <p className="text-zinc-300">
            Your collection of favorite characters ({filteredFavorites.length})
          </p>
        </div>

        {filteredFavorites.length > 0 ? (
          <Cards 
            externalCharacters={filteredFavorites}
            externalLoading={false}
            externalError={null}
          />
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-200 mb-2">No favorites yet</h3>
            <p className="text-zinc-400 mb-4">
              Start exploring and add characters to your favorites collection
            </p>
            <Link href="/ForYouPage">
              <button className="btn-orange-glow">
                Explore Characters
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default FavoritesPage