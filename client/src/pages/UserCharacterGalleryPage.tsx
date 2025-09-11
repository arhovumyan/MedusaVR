import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { ArrowLeft, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';

type UserImage = {
  id: string;
  url: string;
  characterName: string;
  characterId: string;
  characterAvatar?: string;
  createdAt: string;
  isNsfw?: boolean;
};

type Character = {
  id: string;
  name: string;
  avatar?: string;
  isNsfw: boolean;
};

type CharacterImagesResponse = {
  success: boolean;
  character: Character;
  images: UserImage[];
  totalImages: number;
};

export default function UserCharacterGalleryPage(): JSX.Element {
  const { user } = useAuth();
  const { characterId } = useParams();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  
  const { data, isLoading, error } = useQuery<CharacterImagesResponse>({
    queryKey: ['user-gallery-character', user?.username, characterId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/user-gallery/${user?.username}/character/${characterId}`, undefined, {}, 'medium');
      return response.json();
    },
    enabled: Boolean(user?.username && characterId),
  });

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      // Fetch the image as blob to handle cross-origin properly
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create object URL from blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab if download fails
      window.open(imageUrl, '_blank');
    }
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageModal = () => {
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!data?.images || selectedImageIndex === null) return;
    
    if (direction === 'prev') {
      setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : data.images.length - 1);
    } else {
      setSelectedImageIndex(selectedImageIndex < data.images.length - 1 ? selectedImageIndex + 1 : 0);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-6">
        <div className="bg-zinc-800/50 border border-orange-500/20 rounded-lg p-8 text-center">
          <p className="text-zinc-300">Please sign in to view your image gallery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/user-gallery">
              <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                {data?.character.name || characterId} Gallery
              </h1>
              <p className="text-zinc-400 mt-1">
                {data?.totalImages || 0} images
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" text="Loading character images..." />
          </div>
        ) : error ? (
          <div className="text-center text-zinc-400 py-16">
            <p>Failed to load character images.</p>
          </div>
        ) : data && data.images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {data.images.map((img, index) => (
              <div
                key={img.id}
                className="group cursor-pointer relative overflow-hidden rounded-lg border border-orange-500/20 bg-zinc-800/40"
                onClick={() => openImageModal(index)}
              >
                <div className="relative">
                  <img 
                    src={img.url} 
                    alt={`${data.character.name} image ${index + 1}`}
                    className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(img.url, `${data.character.name}_image_${index + 1}.png`);
                    }}
                    className="p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-800/50 border border-orange-500/20 rounded-lg p-12 text-center">
            <div className="text-zinc-300 mb-1">No images found for {data?.character.name}</div>
            <div className="text-zinc-500 text-sm">Generate images with this character and they will appear here.</div>
          </div>
        )}

        {/* Image Modal */}
        {selectedImageIndex !== null && data?.images && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={closeImageModal}
          >
            <div 
              className="relative bg-zinc-800/90 backdrop-blur-md rounded-lg w-full h-full max-w-6xl max-h-full overflow-hidden border border-orange-500/30 flex flex-col"
              style={{
                maxWidth: 'calc(100vw - 16px)', // Full width minus padding (8px on each side)
                maxHeight: 'calc(100vh - 16px)', // Full height minus padding (8px on each side)
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-2 sm:p-4 border-b border-orange-500/20 flex-shrink-0">
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold text-sm sm:text-base truncate">{data.character.name}</h3>
                  <p className="text-zinc-300 text-xs sm:text-sm">
                    Image {selectedImageIndex + 1} of {data.images.length}
                  </p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => downloadImage(
                      data.images[selectedImageIndex].url, 
                      `${data.character.name}_image_${selectedImageIndex + 1}.png`
                    )}
                    className="bg-orange-600 hover:bg-orange-700 text-white p-1.5 sm:p-2 rounded-lg transition-colors"
                  >
                    <Download size={16} className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={closeImageModal}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white p-1.5 sm:p-2 rounded-lg transition-colors"
                  >
                    <X size={16} className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
              
              {/* Image Container */}
              <div className="relative flex-1 flex items-center justify-center p-2">
                <img 
                  src={data.images[selectedImageIndex].url} 
                  alt={`${data.character.name} image ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain mx-auto block"
                  style={{
                    maxWidth: 'calc(100vw - 64px)', // Full width minus padding and header space
                    maxHeight: 'calc(100vh - 120px)', // Full height minus padding and header
                  }}
                />
                
                {/* Navigation arrows */}
                {data.images.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateImage('prev')}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 sm:p-2 rounded-full transition-colors"
                    >
                      <ChevronLeft size={20} className="w-4 h-4 sm:w-6 sm:h-6" />
                    </button>
                    <button
                      onClick={() => navigateImage('next')}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 sm:p-2 rounded-full transition-colors"
                    >
                      <ChevronRight size={20} className="w-4 h-4 sm:w-6 sm:h-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



