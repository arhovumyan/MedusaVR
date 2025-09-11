import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { useRoute, useLocation, Link } from "wouter"; 
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TagBadge, TagList, type Tag } from "@/components/ui/tag";
import { useFavorites } from "@/hooks/useFavorites";
import { useTags } from "@/hooks/useTags";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useApi } from "@/hooks/useApi";
import { useLikes } from "@/hooks/useLikes";
import { useImageBlur } from "@/context/ImageBlurContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { apiRequest } from "@/lib/queryClient";
import { generateUniqueDescription, getThematicDescription } from "@/utils/characterDescriptions";
import { CharacterComments } from "@/components/CharacterComments";
import { SimilarCharacters } from "@/components/SimilarCharacters";
import SEOHead from "@/components/SEO/SEOHead";
import Breadcrumb from "@/components/SEO/Breadcrumb";
import {
  MessageCircle,
  ThumbsUp,
  Heart,
  ImageIcon,
  Star,
  X,
  UserCircle2,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Character } from "@shared/api-types";

export default function CharacterPage() {
  const { toast } = useToast();
  const commentsRef = useRef<HTMLDivElement>(null);
  const [match, params] = useRoute("/characters/:id");
  const [location, setLocation] = useLocation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { requireAuth } = useRequireAuth();
  const { tagCategories: allTags = [], tagMap } = useTags();
  const { isBlurred, shouldBlurNSFW } = useImageBlur();
  const api = useApi();
  const { isLiked, toggleLike } = useLikes();
  const { user } = useAuth();
  const id = params?.id;
  const validId = id && !isNaN(Number(id));

  // Use React Query instead of SWR for better rate limiting integration
  const { data: char, error, isLoading, refetch } = useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      if (!validId) throw new Error('Invalid character ID');
      const response = await apiRequest('GET', `/api/characters/${id}`, undefined, {}, 'high');
      return await response.json() as Character;
    },
    enabled: !!validId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error: any) => {
      // Don't retry rate limit errors
      if (error?.isRateLimit || error?.status === 429) {
        return false;
      }
      // Only retry once for other errors
      return failureCount < 1;
    }
  });

  // Fetch user's generated images for this character
  const { data: userGeneratedImages = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['user-generated-images', user?.username, char?.name],
    queryFn: async () => {
      if (!user?.username || !char?.name) return [];
      const response = await apiRequest('GET', `/api/image-generation/character/${id}`, undefined, {}, 'medium');
      const result = await response.json();
      return result.data?.images || [];
    },
    enabled: !!user?.username && !!char?.name && !!validId,
    staleTime: 30000, // 30 seconds
  });

  const [likes, setLikes] = useState(char?.likes || 0);

  useEffect(() => {
    if (char?.likes !== undefined) {
      setLikes(char.likes);
    }
  }, [char?.likes]);

  const handleLike = async () => {
    if (!char?.id) return;
    try {
      // Use the new toggle function that returns the updated like count
      const result = await toggleLike(parseInt(char.id, 10));
      
      // Check if the request was throttled (returns null)
      if (result === null) {
        console.warn("Like request was throttled");
        return;
      }
      
      // Update the local state with the returned like count
      if (result && typeof result.likes === 'number') {
        setLikes(result.likes);
      }
      
      // Revalidate cache to ensure consistency
      refetch();
    } catch (error) {
      console.error("Failed to toggle like status:", error);
    }
  };

  const handleStartChat = () => {
    if (requireAuth(`start a conversation with ${char?.name}`)) {
      // Navigate to chat page
      window.location.href = `/chat/${id}`;
    }
  };

  const handleGenerateImages = () => {
    if (requireAuth(`generate images with ${char?.name}`)) {
      setLocation(`/generate-images?characterId=${char?.id}`);
    }
  };

  const DescriptionSection: React.FC<{ description: string }> = ({ description }) => {
    const [showFullDescription, setShowFullDescription] = useState(false);
    const isLongDescription = description.length > 100;
    const displayedDescription = isLongDescription && !showFullDescription
      ? description.substring(0, 100) + "..."
      : description;

    return (
      <>
        <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
          {displayedDescription}
        </p>
        {isLongDescription && (
          <Button
            variant="link"
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="p-0 h-auto text-orange-400 hover:text-orange-300"
          >
            {showFullDescription ? "Read Less" : "Read More"}
          </Button>
        )}
      </>
    );
  };

  if (!match || !validId) {
    return <div className="p-4 text-red-500">Invalid character ID in URL.</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-500 mb-2">Failed to load character</div>
        <div className="text-sm text-gray-400">
          {error?.isRateLimit 
            ? "Loading... please wait a moment"
            : error.message || "Please try refreshing the page"
          }
        </div>
      </div>
    );
  }
  
  if (isLoading || !char) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading character..." />
      </div>
    );
  }

  // SEO data for character page
  const characterTags = char.tags?.map((tagName: string) => tagName).join(', ') || '';

  const characterDescription = char.description || generateUniqueDescription(char.name, char.id);

  const characterSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": char.name,
    "description": characterDescription,
    "image": char.avatar || char.avatarUrl,
    "additionalType": "AICharacter",
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": likes
      }
    ],
    "keywords": characterTags
  };

  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Characters', href: '/ForYouPage' },
    { name: char.name, href: `/characters/${char.id}` }
  ];

  return (
    <>
      <SEOHead
        title={`Chat with ${char.name} - AI GirlFriend | MedusaVR`}
        description={`Meet ${char.name}, an AI GirlFriend ready to chat. ${characterDescription} Start conversations, generate images, and explore interactive experiences.`}
        keywords={`${char.name}, AI character, AI GirlFriend, chat bot, virtual GirlFriend, ${characterTags}`}
        structuredData={characterSchema}
        image={char.avatar || char.avatarUrl}
      />
      
      <div className="min-h-screen text-white">
        <Breadcrumb items={breadcrumbItems} />
        
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 opacity-90"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start">
            
            {/* Character Image */}
            <div className="relative group order-1 lg:order-none">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="aspect-[3/4] max-w-sm sm:max-w-md mx-auto lg:mx-0 relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-orange-500/20 shadow-2xl shadow-orange-500/10">
                    <img
                      src={char.avatar || "/fallback.jpg"}
                      alt={char.name}
                      className="w-full h-full object-cover transition-transform duration-500"
                      style={{
                        filter: shouldBlurNSFW(char.isNsfw || false) ? 'blur(20px)' : undefined,
                        opacity: shouldBlurNSFW(char.isNsfw || false) ? 0.6 : undefined
                      }}
                    />
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Stats Badge */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-xs px-4">
                      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-3 border border-orange-500/20">
                        <div className="flex items-center justify-center text-sm">
                          <div className="flex items-center justify-center gap-5">
                            <span className="flex items-center gap-1 text-green-400">
                              <ThumbsUp size={16} />
                              {likes}
                            </span>
                            <span className="flex items-center gap-1 text-orange-300">
                              <MessageCircle size={16} />
                              {(char as any).totalWords ? (
                                (char as any).totalWords > 1000 
                                  ? `${((char as any).totalWords / 1000).toFixed(1)}K` 
                                  : (char as any).totalWords.toLocaleString()
                              ) : (char.chatCount ? (char.chatCount > 1000 
                                ? `${(char.chatCount / 1000).toFixed(1)}K` 
                                : char.chatCount.toLocaleString()
                              ) : '0')}
                            </span>
                            <span className="flex items-center gap-1 text-zinc-400">
                              <Star size={16} />
                              {char.rating ?? 4.8}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent 
                  className="max-w-none max-h-none w-screen h-screen p-0 border-none bg-black/80 backdrop-blur-md"
                  onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
                >
                  <DialogClose asChild>
                    <div 
                      className="absolute inset-0 z-0"
                      onClick={() => {}}
                    />
                  </DialogClose>

                  <DialogTitle className="sr-only">Character Avatar</DialogTitle>
                  <DialogDescription className="sr-only">Full-size view of the character's avatar. Click anywhere outside the image or press the X button to close.</DialogDescription>
                  
                  <DialogClose asChild>
                    <button
                      className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-black/30 hover:bg-white/20 flex items-center justify-center opacity-80 hover:opacity-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                      aria-label="Close image view"
                    >
                      <X className="w-6 h-6 text-white" />
                    </button>
                  </DialogClose>

                  <div 
                    className="flex items-center justify-center w-full h-full p-4 sm:p-8 pointer-events-none"
                  >
                    <img 
                      src={char.avatar || "/fallback.jpg"} 
                      alt="Character Avatar" 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-auto"
                      style={{
                        maxWidth: 'calc(100vw - 32px)', // Full width minus padding (16px on each side)
                        maxHeight: 'calc(100vh - 32px)', // Full height minus padding (16px on each side)
                        filter: shouldBlurNSFW(char.isNsfw || false) ? 'blur(20px)' : undefined,
                        opacity: shouldBlurNSFW(char.isNsfw || false) ? 0.6 : undefined
                      }}
                      onClick={(e) => e.stopPropagation()} // Prevent click on image from closing
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Character Info */}
            <div className="space-y-4 sm:space-y-6 order-2 lg:order-none">
              {/* Title and Creator */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-3">
                  {char.name}
                </h1>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-orange-500/20 mb-3">
                  {/* Creator Avatar */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    {char.creator?.avatarUrl ? (
                      <img 
                        src={char.creator.avatarUrl} 
                        alt={char.creator.username || "Creator"} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <UserCircle2 size={16} className="text-white sm:hidden" />
                        <UserCircle2 size={20} className="text-white hidden sm:block" />
                      </>
                    )}
                  </div>
                  
                  {/* Creator Info */}
                  <div className="flex items-center gap-2 flex-1">
                    <div className="creator">
                      <span className="text-zinc-400 text-sm">Created by </span>
                      {char.creator?.username && char.creatorId ? (
                        <Link href={`/user-profile/${char.creatorId}`} className="font-semibold text-white hover:text-orange-400 transition-colors">
                          @{char.creator.username}
                        </Link>
                      ) : (
                        <span className="font-semibold text-white">@Unknown</span>
                      )}
                      {char.creator?.verified && (
                        <span className="ml-1 text-yellow-500" title="Verified Creator">✓</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Removed Follow Button */}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3">
                  <div className="text-center p-3 sm:p-4 bg-zinc-800/30 backdrop-blur-sm rounded-xl border border-orange-500/10">
                    <div className="text-xs text-zinc-400">Created</div>
                    <div className="text-sm sm:text-base font-bold text-orange-400">
                      {char.createdAt ? new Date(char.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'July 2, 2025'}
                    </div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-zinc-800/30 backdrop-blur-sm rounded-xl border border-orange-500/10">
                    <div className="text-xs text-zinc-400">Last Updated</div>
                    <div className="text-sm sm:text-base font-bold text-orange-400">
                      {char.updatedAt ? new Date(char.updatedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'July 2, 2025'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLike}
                    className={`border-orange-500/30 transition-all duration-200 h-16 rounded-xl ${isLiked(parseInt(char.id, 10)) ? 'text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/50' : 'text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/50'}`}
                  >
                    <ThumbsUp size={20} className="mr-2" />
                    <span className="hidden sm:inline">Like</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      if (char) {
                        toggleFavorite({
                          id: char.id.toString(),
                          avatar: char.avatarUrl || char.avatar || '',
                          name: char.name,
                          description: char.persona || 'No description available',
                          rating: char.isNsfw ? "R" : "PG",
                          nsfw: char.isNsfw || false,
                          chatCount: (char as any).totalWords || char.chatCount || 0
                        });
                      }
                    }}
                    className={`border-orange-500/30 transition-all duration-200 h-16 rounded-xl ${isFavorite(char?.id) ? 'text-red-500 hover:bg-red-500/10 hover:border-red-500/50' : 'text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/50'}`}
                  >
                    <Heart size={20} className="mr-2" />
                    <span className="hidden sm:inline">Favorite</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all duration-200 h-16 rounded-xl"
                  >
                    <MessageSquare size={20} className="mr-2" />
                    <span className="hidden sm:inline">Comment</span>
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 sm:p-6 bg-zinc-800/30 backdrop-blur-sm rounded-xl border border-orange-500/10">
                <h3 className="text-base sm:text-lg font-semibold text-orange-300 mb-3">About</h3>
                <DescriptionSection description={
                  char.description || char.persona || 'No description available'
                } />
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Categories & Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {char.selectedTags && Object.values(char.selectedTags).some(tagArray => tagArray && tagArray.length > 0) ? (
                    <TagList 
                      tags={Object.values(char.selectedTags).flat().filter(Boolean)}
                      buttonStyle={true}
                      clickable={true}
                      className="gap-2"
                    />
                  ) : (
                    // Default tags if none are set - using real tags from the system
                    <TagList 
                      tags={["romance", "fantasy", "caring"]}
                      buttonStyle={true}
                      clickable={true}
                      className="gap-2"
                    />
                  )}
                  {char.isNsfw && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200 gap-1.5"
                    >
                      <span className="text-sm">🔞</span>
                      <span>NSFW</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl shadow-orange-500/25 transition-all duration-200 hover:scale-105 h-16 sm:h-20 text-sm sm:text-base"
                  onClick={handleStartChat}
                >
                  <MessageCircle size={16} className="mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Start Chat</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all duration-200 h-16 sm:h-20 text-sm sm:text-base"
                  onClick={handleGenerateImages}
                >
                  <ImageIcon size={16} className="mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">Generate</span>
                  <span className="sm:hidden truncate">Generate</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all duration-200 h-16 sm:h-20 text-sm sm:text-base"
                  onClick={() => {
                    if (requireAuth(`view this character's images`)) {
                      window.location.href = `/user-gallery/character/${id}`;
                    }
                  }}
                >
                  <ImageIcon size={16} className="mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Images</span>
                </Button>
              </div>

              {/* Character Stats */}
              {/* Generated Images Gallery */}
              <div className="bg-zinc-800/30 backdrop-blur-sm rounded-xl border border-orange-500/10 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-orange-300">Your Generated Images</h3>
                  <span className="text-xs text-zinc-400">
                    {userGeneratedImages.length > 0 ? `${userGeneratedImages.length} images` : 'Gallery'}
                  </span>
                </div>
                
                {imagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="sm" text="Loading your images..." />
                  </div>
                ) : userGeneratedImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {userGeneratedImages.slice(0, 12).map((image: any, index: number) => (
                      <Dialog key={image.url || index}>
                        <DialogTrigger asChild>
                          <div className="aspect-square bg-zinc-700/50 rounded-lg border border-orange-500/20 relative overflow-hidden group hover:border-orange-500/40 transition-colors cursor-pointer">
                            <img
                              src={image.url}
                              alt={`Generated image ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              style={{
                                filter: shouldBlurNSFW(char.isNsfw || false) ? 'blur(10px)' : undefined,
                                opacity: shouldBlurNSFW(char.isNsfw || false) ? 0.8 : undefined
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute bottom-2 left-2 right-2 text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {image.filename || `Image ${index + 1}`}
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-none max-h-none w-screen h-screen p-0 border-none bg-black/90 backdrop-blur-md">
                          <DialogClose asChild>
                            <div className="absolute inset-0 z-0" />
                          </DialogClose>
                          <DialogTitle className="sr-only">Generated Image</DialogTitle>
                          <DialogDescription className="sr-only">Full-size view of generated image</DialogDescription>
                          <DialogClose asChild>
                            <button
                              className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-black/30 hover:bg-white/20 flex items-center justify-center opacity-80 hover:opacity-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                              aria-label="Close image view"
                            >
                              <X className="w-6 h-6 text-white" />
                            </button>
                          </DialogClose>
                          <div className="flex items-center justify-center w-full h-full p-4 sm:p-8">
                            <img 
                              src={image.url} 
                              alt="Generated Image" 
                              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                              style={{
                                maxWidth: 'calc(100vw - 32px)', // Full width minus padding (16px on each side)
                                maxHeight: 'calc(100vh - 32px)', // Full height minus padding (16px on each side)
                                filter: shouldBlurNSFW(char.isNsfw || false) ? 'blur(10px)' : undefined,
                                opacity: shouldBlurNSFW(char.isNsfw || false) ? 0.8 : undefined
                              }}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                    {userGeneratedImages.length > 12 && (
                      <div className="aspect-square bg-zinc-700/30 rounded-lg border border-orange-500/20 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-sm text-zinc-400">+{userGeneratedImages.length - 12}</span>
                          <div className="text-xs text-zinc-500 mt-1">more images</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    {user ? (
                      <>
                        <p className="text-sm">You haven't generated any images with this character yet</p>
                        <p className="text-xs mt-1">Click "Generate Images" to create your first image!</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm">Sign in to see your generated images</p>
                        <p className="text-xs mt-1">Your personal gallery will appear here</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Characters Section */}
      <div className="mt-16 pt-8 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold mb-8 text-center">Similar Characters</h2>
          <SimilarCharacters currentCharacterId={char.id} characterTags={char.tags || []} />
        </div>
      </div>

      {/* Comments Section */}
      <div ref={commentsRef} className="mt-16 pt-8 border-t border-zinc-800/50">
        <CharacterComments characterId={id} />
      </div>
    </div>
    </>
  );
}