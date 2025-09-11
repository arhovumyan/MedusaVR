import React from "react";
import { Plus, Users, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BrandingFooter } from "@/components/layout/BrandingFooter";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Character } from "@shared/api-types";
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { generateUniqueDescription, getThematicDescription } from '@/utils/characterDescriptions';
import Cards from '@/components/ui/cards';

export default function UserCharacters() {
  const { user, isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  // Fetch user's created characters
  const { data: characters = [], isLoading, error } = useQuery({
    queryKey: ['user-characters', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await apiRequest('GET', `/api/characters/creator/${user.id}`);
      return await response.json() as Character[];
    },
    enabled: isAuthenticated && !!user?.id,
  });

  const handleFavoriteClick = (e: React.MouseEvent, character: Character) => {
    e.preventDefault();
    e.stopPropagation();
    // Convert to the format expected by useFavorites
    const favoriteCharacter = {
      id: parseInt(character.id),
      avatar: character.avatarUrl || character.avatar || '',
      name: character.name,
      description: character.persona || '',
      rating: character.rating?.toString() || 'PG',
      nsfw: character.isNsfw || false,
      chatCount: character.chatCount || 0,
    };
    toggleFavorite(favoriteCharacter);
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-32">
            <LoadingSpinner size="xl" text="Loading your characters..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-4">
            My Characters
          </h1>
          <p className="text-zinc-300">
            Create and manage your personal AI characters ({characters.length})
          </p>
        </div>

        {/* Create Character Button */}
        <div className="mb-8 flex justify-center">
          <Link href="/create-character">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 text-lg px-8 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Character
            </Button>
          </Link>
        </div>

        {characters.length > 0 ? (
          /* Characters Grid */
          <Cards
            externalCharacters={characters}
            externalLoading={false}
            externalError={null}
          />
        ) : (
          /* Empty State */
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-12 text-center shadow-2xl shadow-orange-500/10">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-zinc-700/50 to-zinc-800/50 border-2 border-dashed border-orange-500/30 rounded-xl flex items-center justify-center">
              <Plus className="w-12 h-12 text-orange-400" />
            </div>

            <h2 className="text-2xl font-semibold text-zinc-200 mb-4">
              It's a bit empty here, isn't it?
            </h2>
            <p className="text-zinc-400 mb-8 text-lg">
              Let's create a character exclusively for you
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              {[
                { icon: Users, title: "Unlimited", desc: "Characters" },
                { icon: Plus, title: "Easy", desc: "Creation" },
                { icon: Users, title: "Custom", desc: "Personalities" },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="bg-zinc-800/30 rounded-xl p-4 border border-orange-500/10"
                >
                  <feature.icon className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <h4 className="font-semibold text-zinc-200">{feature.title}</h4>
                  <p className="text-sm text-zinc-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-10 text-center">
          <BrandingFooter />
        </div>
      </div>
    </div>
  );
}