import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import Cards from '@/components/ui/cards';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEO/SEOHead';
import type { Character } from '@shared/api-types';
import type { Character as LocalCharacter } from '@/constants';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const SearchPage = () => {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Extract search query from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('q');
    if (searchParam) {
      setSearchQuery(decodeURIComponent(searchParam));
    }
  }, [location]);

  // Fetch search results from server
  const { data: searchResponse, isLoading, error } = useQuery({
    queryKey: ['character-search', searchQuery, currentPage],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return null;
      const response = await apiRequest('GET', `/api/characters/search?q=${encodeURIComponent(searchQuery)}&page=${currentPage}`);
      return await response.json();
    },
    enabled: !!searchQuery && searchQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  const characters = searchResponse?.data || [];

  // Use server-side search results directly
  const searchResults = useMemo(() => {
    return characters;
  }, [characters]);

  // Transform search results to match the local Character interface expected by Cards component
  const transformedSearchResults = useMemo((): LocalCharacter[] => {
    return searchResults.map((char: Character): LocalCharacter => ({
      id: parseInt(char.id) || 0,
      avatar: char.avatarUrl || char.avatar || char.imageUrl || char.profile_image || '',
      name: char.name,
      description: char.description || char.persona || 'No description available',
      rating: char.rating?.toString() || 'PG',
      nsfw: char.isNsfw || char.nsfw || false,
      chatCount: char.chatCount || 0,
      tagNames: char.tagNames
    }));
  }, [searchResults]);

  return (
    <>
      <SEOHead 
        title={searchQuery ? `Search Results for "${searchQuery}" - AI Characters | MedusaVR` : "Search AI Characters & Companions | MedusaVR"}
        description={searchQuery ? 
          `Find AI characters matching "${searchQuery}". Browse NSFW characters, anime personalities, and AI companions for chat and roleplay.` :
          "Search through thousands of AI characters and companions. Find anime personalities, AI girlfriends, NSFW characters, and custom AI companions for chat and roleplay."
        }
        keywords="search AI characters, find AI companions, AI character search, anime character search, NSFW AI search, AI girlfriend search, character finder"
        url={`https://medusa-vrfriendly.vercel.app/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SearchResultsPage",
          "name": searchQuery ? `Search Results for "${searchQuery}"` : "AI Character Search",
          "description": "Search and discover AI characters and companions",
          "url": `https://medusa-vrfriendly.vercel.app/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`
        }}
      />
      <div className='text-white'>
      <div className="max-w-7xl mx-auto px-4 lg:px-0">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-4">
            Search AI Characters & Companions
          </h1>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-zinc-300 mb-4">
              Find the perfect AI character for chat, roleplay, or creative conversations. Search through our extensive library of AI companions with unique personalities and styles.
            </p>
            <p className="text-zinc-400">
              Search by character name, personality traits, conversation topics, or character tags. Discover NSFW characters, anime personalities, realistic companions, and custom AI characters created by our community.
            </p>
          </div>
          
          {/* SEO keyword-rich search suggestions */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <span className="text-xs text-zinc-500">Popular searches:</span>
            <button className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-orange-400 transition-colors">
              AI girlfriend
            </button>
            <button className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-orange-400 transition-colors">
              Anime characters
            </button>
            <button className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-orange-400 transition-colors">
              NSFW chat
            </button>
            <button className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-orange-400 transition-colors">
              Roleplay partners
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-8 shadow-2xl shadow-orange-500/10">
          {!searchQuery ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-300 mb-2">Start Your Search</h3>
              <p className="text-zinc-400 mb-6">
                Enter a character name, description, or tag to find what you're looking for
              </p>
            </div>
          ) : searchQuery.length < 2 ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-300 mb-2">Keep Typing...</h3>
              <p className="text-zinc-400 mb-6">
                Enter at least 2 characters to start searching
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-16">
              <LoadingSpinner size="lg" text="Searching characters..." />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="mb-4">
                <Search className="w-16 h-16 text-red-500 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-red-300 mb-2">Search Error</h3>
              <p className="text-zinc-400 mb-4">There was an error searching for characters</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              {/* Search Results Header */}
              <div className="mb-6 text-center">
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">
                  Found {searchResponse?.pagination?.total || searchResults.length} characters
                </h3>
                <p className="text-zinc-400 text-sm">
                  Showing results for "{searchQuery}"
                </p>
              </div>
              
              <Cards 
                externalCharacters={transformedSearchResults}
                externalLoading={false}
                externalError={null}
              />
              
              {/* Pagination Controls */}
              {searchResponse?.pagination && (
                <div className="mt-8 flex justify-center items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={!searchResponse.pagination.hasPrev}
                    className="bg-zinc-800 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  >
                    Previous
                  </Button>
                  
                  <span className="text-zinc-300">
                    Page {searchResponse.pagination.page + 1} of {searchResponse.pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!searchResponse.pagination.hasNext}
                    className="bg-zinc-800 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-300 mb-2">No Results Found</h3>
              <p className="text-zinc-400 mb-6">
                No characters found matching "{searchQuery}". Try a different search term or check for typos.
              </p>
              <div className="space-y-2 text-sm text-zinc-500">
                <p>💡 Tips for better results:</p>
                <ul className="list-disc list-inside text-left max-w-md mx-auto space-y-1">
                  <li>Try searching for partial names (e.g., "Sak" for "Sakura")</li>
                  <li>Search by character traits, personality, or tags</li>
                  <li>Use simpler, more general terms</li>
                  <li>Check spelling and try variations</li>
                  <li>Search by art style or genre</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default SearchPage; 