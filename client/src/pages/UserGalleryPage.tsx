import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Grid, Image as ImageIcon, ImageDown, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';

type UserImage = {
  id: string;
  url: string;
  characterName: string;
  characterId: string;
  characterAvatar?: string;
  createdAt: string;
  isNsfw?: boolean;
};

type CharacterGroup = {
  characterId: string;
  characterName: string;
  characterAvatar?: string;
  images: UserImage[];
  totalImages: number;
  isNsfw?: boolean;
};

type UserGalleryResponse = {
  success: boolean;
  characterGroups: CharacterGroup[];
  totalCharacters: number;
  totalImages: number;
};

export default function UserGalleryPage(): JSX.Element {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<{ image: UserImage; groupImages: UserImage[]; index: number } | null>(null);

  const { data, isLoading, error } = useQuery<UserGalleryResponse>({
    queryKey: ['user-gallery', user?.username],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/user-gallery/${user?.username}`, undefined, {}, 'medium');
      return response.json();
    },
    enabled: Boolean(user?.username),
  });

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(imageUrl, '_blank');
    }
  };

  const openImageModal = (image: UserImage, groupImages: UserImage[], index: number) => {
    setSelectedImage({ image, groupImages, index });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedImage) return;
    
    const { groupImages, index } = selectedImage;
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = index > 0 ? index - 1 : groupImages.length - 1;
    } else {
      newIndex = index < groupImages.length - 1 ? index + 1 : 0;
    }
    
    setSelectedImage({
      image: groupImages[newIndex],
      groupImages,
      index: newIndex
    });
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Your Image Gallery</h1>
          <p className="text-zinc-400 mt-1">All images you generated across characters</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" text="Loading your gallery..." />
          </div>
        ) : error ? (
          <div className="text-center text-zinc-400 py-16">
            <p>Failed to load your gallery.</p>
          </div>
        ) : data && data.characterGroups.length > 0 ? (
          <div className="space-y-8">
            {data.characterGroups.map((group) => (
              <div key={group.characterId} className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 shadow-2xl shadow-orange-500/10 rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {group.characterAvatar ? (
                        <img
                          src={group.characterAvatar}
                          alt={group.characterName}
                          className="w-10 h-10 rounded-md object-cover border border-orange-500/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md border border-orange-500/30 bg-zinc-800/50 flex items-center justify-center text-orange-300">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-semibold">{group.characterName}</h2>
                        <p className="text-sm text-zinc-400">{group.totalImages} image{group.totalImages === 1 ? '' : 's'}</p>
                      </div>
                    </div>
                    <div>
                      <Link href={`/user-gallery/character/${group.characterId}`}>
                        <button className="border border-orange-500/40 text-orange-300 hover:bg-orange-500/10 px-4 py-2 rounded-md transition-colors">
                          View all
                        </button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {group.images.map((img, index) => (
                      <div 
                        key={img.id} 
                        className="group cursor-pointer relative overflow-hidden rounded-lg border border-orange-500/20 bg-zinc-800/40"
                        onClick={() => openImageModal(img, group.images, index)}
                      >
                        <img 
                          src={img.url} 
                          alt={`${group.characterName}`} 
                          className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300" 
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadImage(img.url, `${group.characterName}_image_${index + 1}.png`);
                            }}
                            className="p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-800/50 border border-orange-500/20 rounded-lg p-12 text-center">
            <ImageDown className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <div className="text-zinc-300 mb-1">No images found</div>
            <div className="text-zinc-500 text-sm">Generate images with characters and they will appear here.</div>
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
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
                  <h3 className="text-white font-semibold text-sm sm:text-base truncate">{selectedImage.image.characterName}</h3>
                  <p className="text-zinc-300 text-xs sm:text-sm">
                    Image {selectedImage.index + 1} of {selectedImage.groupImages.length}
                  </p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => downloadImage(
                      selectedImage.image.url, 
                      `${selectedImage.image.characterName}_image_${selectedImage.index + 1}.png`
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
                  src={selectedImage.image.url} 
                  alt={`${selectedImage.image.characterName} image ${selectedImage.index + 1}`}
                  className="max-w-full max-h-full object-contain mx-auto block"
                  style={{
                    maxWidth: 'calc(100vw - 64px)', // Full width minus padding and header space
                    maxHeight: 'calc(100vh - 120px)', // Full height minus padding and header
                  }}
                />
                
                {/* Navigation arrows */}
                {selectedImage.groupImages.length > 1 && (
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


