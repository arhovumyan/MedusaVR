import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { apiRequest } from "@/lib/queryClient";
import { useImageBlur } from "@/context/ImageBlurContext";
import { Heart, ThumbsUp } from "lucide-react";
import type { Character } from "@shared/api-types";

interface SimilarCharactersProps {
  currentCharacterId: string;
  characterTags: string[];
}

export const SimilarCharacters: React.FC<SimilarCharactersProps> = ({
  currentCharacterId,
  characterTags
}) => {
  const { shouldBlurNSFW } = useImageBlur();

  const { data: similarCharacters = [], isLoading } = useQuery({
    queryKey: ['similar-characters', currentCharacterId, characterTags],
    queryFn: async () => {
      try {
        // Try to get characters with similar tags or fallback to random popular characters
        const response = await apiRequest('GET', `/api/characters?limit=6&exclude=${currentCharacterId}`, undefined, {}, 'low');
        const result = await response.json();
        return (result.data || result) as Character[];
      } catch (error) {
        console.error('Failed to fetch similar characters:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" text="Finding similar characters..." />
      </div>
    );
  }

  if (!similarCharacters.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {similarCharacters.slice(0, 6).map((character) => (
        <Link
          key={character.id}
          href={`/characters/${character.id}`}
          className="group block"
        >
          <div className="bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800/50 hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
            {/* Character Image */}
            <div className="aspect-[3/4] relative overflow-hidden">
              <img
                src={character.avatar || character.avatarUrl || "/fallback.jpg"}
                alt={`${character.name} - AI Character`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                style={{
                  filter: shouldBlurNSFW(character.isNsfw || character.nsfw || false) ? 'blur(10px)' : undefined,
                  opacity: shouldBlurNSFW(character.isNsfw || character.nsfw || false) ? 0.7 : undefined
                }}
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Stats overlay */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center justify-between text-sm text-white/90">
                  {character.likes !== undefined && (
                    <span className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full">
                      <ThumbsUp size={14} />
                      {character.likes}
                    </span>
                  )}
                  {(character.isNsfw || character.nsfw) && (
                    <Badge variant="secondary" className="bg-red-600/80 text-white text-xs">
                      18+
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Character Info */}
            <div className="p-4">
              <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors duration-200 mb-2">
                {character.name}
              </h3>
              
              {character.description && (
                <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
                  {character.description}
                </p>
              )}
              
              {/* Tags */}
              {character.tags && character.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {character.tags.slice(0, 3).map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs border-zinc-700 text-zinc-300 hover:border-orange-500/50"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {character.tags.length > 3 && (
                    <span className="text-xs text-zinc-500">+{character.tags.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};
