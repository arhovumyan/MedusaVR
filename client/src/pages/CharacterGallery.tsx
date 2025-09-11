import React, { useState, useMemo, useEffect } from 'react';
import { Grid, Filter, Search, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { TagFilter } from '@/components/TagFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useIsMobile } from '@/hooks/use-mobile';
import { useImageBlur } from '@/context/ImageBlurContext';
import Cards from '@/components/ui/cards';
import type { Character } from '@shared/api-types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const CharacterGallery = () => {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [includeNSFW, setIncludeNSFW] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isMobile = useIsMobile();
  const { showNSFW } = useImageBlur();

  // Extract search query from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchQuery(decodeURIComponent(searchParam));
    }
  }, [location]);

  // Fetch characters from API
  const { data: characters = [], isLoading, error } = useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/characters');
      return await response.json() as Character[];
    },
  });

  // Filter characters based on search and tags
  const filteredCharacters = useMemo(() => {
    return characters.filter((character: Character) => {
      // Search filter
      if (searchQuery && !character.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(character.persona || '').toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Don't filter out NSFW content - it will be blurred instead
      // The showNSFW state is used for blurring in the component rendering

      // Local NSFW filter (from the gallery filter)
      if (!includeNSFW && character.isNsfw) {
        return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        // Handle case where character.tags might be null/undefined or empty
        const characterTags = Array.isArray(character.tags) ? character.tags : [];
        const hasMatchingTag = selectedTags.some(selectedTag => 
          characterTags.some(charTag => 
            charTag && charTag.toLowerCase() === selectedTag.toLowerCase()
          )
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [characters, searchQuery, selectedTags, includeNSFW, showNSFW]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setIncludeNSFW(false);
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || includeNSFW;

  const FilterContent = () => (
    <TagFilter
      selectedTags={selectedTags}
      onTagsChange={setSelectedTags}
      includeNSFW={includeNSFW}
      onIncludeNSFWChange={setIncludeNSFW}
    />
  );

  return (
    <div className='text-white'>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-4">
            Character Gallery
          </h1>
          <p className="text-zinc-300 mb-6">
            Discover and explore our vast collection of AI characters 
            {!isLoading && `(${filteredCharacters.length} characters)`}
          </p>
          
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 backdrop-blur-sm border border-orange-500/20 rounded-xl text-zinc-100 placeholder:text-zinc-400 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
             
            <div className="flex gap-2">
              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="px-4 py-3 border-orange-500/20 hover:border-orange-500/50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}

              {/* Filter Toggle */}
              {isMobile ? (
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button className="px-6 py-3 bg-zinc-800/50 backdrop-blur-sm border border-orange-500/20 rounded-xl hover:bg-zinc-700/50 transition-all duration-200 flex items-center gap-2">
                      <Filter className="w-5 h-5 text-orange-400" />
                      Filters
                      {(selectedTags.length > 0 || includeNSFW) && (
                        <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1">
                          {selectedTags.length + (includeNSFW ? 1 : 0)}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <Button 
                  variant={selectedTags.length > 0 || includeNSFW ? "default" : "outline"}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="px-6 py-3 border-orange-500/20 hover:border-orange-500/50 transition-all duration-200 flex items-center gap-2"
                >
                  <Filter className="w-5 h-5" />
                  Filters
                  {(selectedTags.length > 0 || includeNSFW) && (
                    <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1 ml-1">
                      {selectedTags.length + (includeNSFW ? 1 : 0)}
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Sidebar Filter */}
          {!isMobile && isFilterOpen && (
            <div className="w-80 flex-shrink-0">
              <div className="sticky top-6 bg-zinc-800/50 backdrop-blur-sm border border-orange-500/20 rounded-xl p-6">
                <FilterContent />
              </div>
            </div>
          )}

          {/* Character Grid */}
          <div className="flex-1">
            <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-8 shadow-2xl shadow-orange-500/10">
              {isLoading ? (
                <div className="text-center py-12">
                  <LoadingSpinner size="lg" text="Loading characters..." />
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <Grid className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  </div>
                  <h3 className="text-xl font-semibold text-red-300 mb-2">Failed to load characters</h3>
                  <p className="text-zinc-400 mb-4">There was an error loading character data</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : filteredCharacters.length > 0 ? (
                <Cards 
                  externalCharacters={filteredCharacters}
                  externalLoading={false}
                  externalError={null}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <Grid className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-300 mb-2">No characters found</h3>
                  <p className="text-zinc-400 mb-4">
                    {hasActiveFilters 
                      ? "Try adjusting your filters or search terms" 
                      : "No characters available at the moment"}
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={clearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterGallery