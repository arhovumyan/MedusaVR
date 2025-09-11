import React, { memo, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { buildSrcSet, getOptimizedCardImageUrl } from "@/lib/imageUrl";
import { Heart, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { apiRequest } from "@/lib/queryClient";
import type { Character } from "@/constants";
import { useImageBlur } from "@/context/ImageBlurContext";
import { useAuth } from "@/hooks/useAuth";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Enhanced Character Card for carousel
const CharacterCard = memo(({
  char,
  isCharacterFavorite,
  onFavoriteClick,
  shouldBlurNSFW
}: {
  char: Character;
  isCharacterFavorite: boolean;
  onFavoriteClick: (e: React.MouseEvent, character: Character) => void;
  shouldBlurNSFW: (isNSFW: boolean) => boolean;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(240);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setContainerWidth(el.clientWidth || 240);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  
  return (
    <div className="px-1"> {/* Reduced padding for tighter spacing */}
      <Link
        to={`/characters/${char.id}`}
        key={char.id}
        className="block"
        onClick={() => console.log(`Navigating to character ${char.id}`)}
      >
        <div ref={containerRef} className="character-card responsive-character-card relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 ease-in-out group">
          {/* Skeleton background while loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 animate-pulse" />
          )}
          
          <img
            src={getOptimizedCardImageUrl(char.avatar, Math.min(480, containerWidth * 1.5))}
            alt={char.name}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${shouldBlurNSFW(char.nsfw) ? 'filter blur-md' : ''}`}
            sizes="(max-width: 640px) 50vw, 240px"
            srcSet={buildSrcSet(char.avatar, [200, 320, 480]) || undefined}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
          
          {/* Overlay with character info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 group-hover:opacity-90 transition-opacity duration-300" />
          
          {/* Character name and description */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-white font-semibold text-sm truncate flex-1 mr-2">
                {char.name}
              </h3>
              <button
                onClick={(e) => onFavoriteClick(e, char)}
                className="flex-shrink-0 p-1 rounded-full bg-black/20 backdrop-blur-sm transition-colors duration-200 hover:bg-black/40"
              >
                <Heart
                  className={`h-4 w-4 transition-colors duration-200 ${
                    isCharacterFavorite
                      ? 'text-red-500 fill-current'
                      : 'text-white hover:text-red-400'
                  }`}
                />
              </button>
            </div>
            
            <p className="text-zinc-300 text-xs line-clamp-2 leading-tight">
              {char.description}
            </p>
            
            {/* Chat count */}
            <div className="flex items-center mt-2 text-zinc-400">
              <MessageCircle className="h-3 w-3 mr-1" />
              <span className="text-xs">
                {char.chatCount >= 1000
                  ? `${(char.chatCount / 1000).toFixed(1)}K`
                  : char.chatCount || 0}
              </span>
            </div>
          </div>
          
          {/* NSFW indicator */}
          {char.nsfw && !shouldBlurNSFW(char.nsfw) && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/90 backdrop-blur-sm rounded text-white text-xs font-medium">
              18+
            </div>
          )}
        </div>
      </Link>
    </div>
  );
});

CharacterCard.displayName = "CharacterCard";

// Custom arrow components
const PrevArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200"
  >
    <ChevronLeft className="h-5 w-5" />
  </button>
);

const NextArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200"
  >
    <ChevronRight className="h-5 w-5" />
  </button>
);

interface FeaturedCharactersCarouselProps {
  refreshKey?: number;
  limit?: number;
}

export default function FeaturedCharactersCarousel({ 
  refreshKey = 0, 
  limit = 20 
}: FeaturedCharactersCarouselProps) {
  const { user } = useAuth();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { shouldBlurNSFW } = useImageBlur();

  const { data: characters = [], isLoading, error } = useQuery({
    queryKey: ["characters", "featured", refreshKey, limit],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/characters?mode=featured&limit=${limit}`, undefined, {}, 'medium');
      const data = await response.json();
      return data || [];  // API returns array directly, not wrapped in 'characters' property
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleFavoriteClick = async (e: React.MouseEvent, character: Character) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    await toggleFavorite(character);
  };

  // Slick slider settings
  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
          dots: false
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          centerMode: true,
          centerPadding: '20px'
        }
      }
    ]
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-zinc-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || characters.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-400">No featured characters available.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <style>{`
        .featured-carousel .slick-slide {
          padding: 0 4px;
        }
        .featured-carousel .slick-list {
          margin: 0 -4px;
        }
      `}</style>
      <Slider {...sliderSettings} className="featured-carousel">
        {characters.map((char: Character) => {
          const isCharacterFavorite = isFavorite(char.id);
          
          return (
            <CharacterCard
              key={char.id}
              char={char}
              isCharacterFavorite={isCharacterFavorite}
              onFavoriteClick={handleFavoriteClick}
              shouldBlurNSFW={shouldBlurNSFW}
            />
          );
        })}
      </Slider>
    </div>
  );
}
