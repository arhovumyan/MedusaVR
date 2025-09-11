import React, { useMemo, useCallback, memo } from 'react';
import { useRoute, Link } from 'wouter';
import { ArrowLeft, Filter, Users, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { useFavorites } from '@/hooks/useFavorites';
import { useTags } from '@/hooks/useTags';
import { useImageBlur } from '@/context/ImageBlurContext';
import { generateUniqueDescription, getThematicDescription } from '@/utils/characterDescriptions';
import type { Character } from '@shared/api-types';
import type { Character as LocalCharacter } from '@/constants';
import type { Tag } from '@/components/ui/tag';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Cards from '@/components/ui/cards';

const TagPage = () => {
  const [match, params] = useRoute('/tags/:tagName');
  const tagName = params?.tagName ? decodeURIComponent(params.tagName) : '';
  
  const { tagCategories: allTags = [], tagMap } = useTags();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showNSFW } = useImageBlur();
  
    // Handle favorite click with event propagation stop
  const handleFavoriteClick = useCallback((e: React.MouseEvent, character: Character) => {
    e.preventDefault();
    e.stopPropagation();
    // Convert to the format expected by useFavorites (local Character interface)
    const favoriteCharacter = {
      id: parseInt(character.id) || 0,
      avatar: character.avatarUrl || character.avatar || character.imageUrl || character.profile_image || '',
      name: character.name,
      description: character.description || character.persona || 'No description available',
      rating: character.rating?.toString() || 'PG',
      nsfw: character.isNsfw || character.nsfw || false,
      chatCount: character.chatCount || 0
    };
    toggleFavorite(favoriteCharacter);
  }, [toggleFavorite]);
  
  // Find the tag data for display purposes
  const tagData = useMemo(() => {
    // Flatten all tags from all categories to find the matching tag
    const allTagsFlat = allTags.flatMap(category => category.tags);
    return allTagsFlat.find((tag: any) => 
      tag.name.toLowerCase() === tagName.toLowerCase() ||
      tag.displayName.toLowerCase() === tagName.toLowerCase()
    );
  }, [allTags, tagName]);

  // Fetch all characters
  const { data: characters = [], isLoading, error } = useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/characters');
      return await response.json() as Character[];
    },
  });

  // Filter characters that have the specified tag
  const filteredCharacters = useMemo(() => {
    if (!tagName || !characters.length) return [];
    
    console.log(`[TagPage] Filtering for tag: "${tagName}"`);
    console.log(`[TagPage] Total characters: ${characters.length}`);
    
    const filtered = characters.filter((character: Character) => {
      // Safety check for undefined character or missing id
      if (!character || !character.id) {
        console.warn('Filtering out character with missing data:', character);
        return false;
      }
      
      let hasTag = false;
      const lowerTagName = tagName.toLowerCase();
      
      // Method 1: Check selectedTags object for tag IDs that map to our target tag name
      if (character.selectedTags && typeof character.selectedTags === 'object') {
        hasTag = Object.values(character.selectedTags).some(tagArray => 
          tagArray?.some((tagId: string) => {
            // Map tag ID to tag object and check both name and displayName
            const tagObj = tagMap?.[tagId];
            if (tagObj) {
              return tagObj.name?.toLowerCase() === lowerTagName || 
                     tagObj.displayName?.toLowerCase() === lowerTagName;
            }
            // Also check if the tag ID itself matches the tag name
            return tagId?.toLowerCase() === lowerTagName;
          })
        );
      }
      
      // Method 2: Check legacy tagNames array (contains tag names directly)
      if (!hasTag && character.tagNames && Array.isArray(character.tagNames)) {
        hasTag = character.tagNames.some((tag: string) => 
          tag?.toLowerCase() === lowerTagName
        );
      }
      
      // Method 3: Check legacy tags field (if it exists)
      if (!hasTag && character.tags && Array.isArray(character.tags)) {
        hasTag = character.tags.some((tag: string) => 
          tag?.toLowerCase() === lowerTagName
        );
      }
      
      // Method 4: Check if tag name appears in character's selected tags flattened
      if (!hasTag && character.selectedTags) {
        const allTagIds = Object.values(character.selectedTags).flat().filter(Boolean);
        hasTag = allTagIds.some(tagId => {
          if (typeof tagId === 'string') {
            return tagId.toLowerCase() === lowerTagName;
          }
          return false;
        });
      }
      
      if (hasTag) {
        console.log(`[TagPage] Character "${character.name}" matches tag "${tagName}"`);
      }
      
      return hasTag;
    });
    
    console.log(`[TagPage] Filtered characters: ${filtered.length}`);
    return filtered;
  }, [characters, tagName, tagMap]);

  // Transform filtered characters to match the local Character interface expected by Cards component
  const transformedCharacters = useMemo((): LocalCharacter[] => {
    return filteredCharacters.map((char: Character): LocalCharacter => ({
      id: parseInt(char.id) || 0,
      avatar: char.avatarUrl || char.avatar || char.imageUrl || char.profile_image || '',
      name: char.name,
      description: char.description || char.persona || 'No description available',
      rating: char.rating?.toString() || 'PG',
      nsfw: char.isNsfw || char.nsfw || false,
      chatCount: char.chatCount || 0,
      tagNames: char.tagNames
    }));
  }, [filteredCharacters]);

  if (!match) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="text-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 lg:px-0 py-8">
          <div className="flex items-center justify-center py-32">
            <LoadingSpinner size="xl" text="Loading characters..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 lg:px-0 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Characters</h1>
            <p className="text-gray-400 mb-4">There was an error loading characters for this tag.</p>
            <Link href="/gallery">
              <Button variant="outline" className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Gallery
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 lg:px-0 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/gallery">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            {tagData?.emoji && (
              <span className="text-3xl">{tagData.emoji}</span>
            )}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                {tagData?.displayName || tagName}
              </h1>
              {/* {tagData?.description && (
                <p className="text-gray-400 mt-1">{tagData.description}</p>
              )} */}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{filteredCharacters.length} characters</span>
            </div>
            {tagData?.category && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="capitalize">{tagData.category.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Characters Grid */}
        {transformedCharacters.length > 0 ? (
          <Cards 
            externalCharacters={transformedCharacters}
            externalLoading={false}
            externalError={null}
          />
        ) : (
          <div className="text-center py-16">
            <div className="mb-4 text-6xl opacity-20">
              {tagData?.emoji || '🔍'}
            </div>
            <h2 className="text-xl font-semibold text-gray-300 mb-2">
              No characters found
            </h2>
            <p className="text-gray-400 mb-6">
              There are currently no characters with the "{tagData?.displayName || tagName}" tag.
            </p>
            <Link href="/gallery">
              <Button 
                variant="outline" 
                className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/50"
              >
                Browse All Characters
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagPage;
