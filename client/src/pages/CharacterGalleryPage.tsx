import React, { useState } from 'react';
import { ArrowLeft, Download, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import type { Character } from '@shared/api-types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Link, useLocation, useRoute } from 'wouter';
import GeneratedImages from '@/components/ui/GeneratedImages';

const CharacterGalleryPage = () => {
  const { user } = useAuth();
  const [location] = useLocation();
  const [match, params] = useRoute('/character-gallery/:characterId');
  const characterId = params?.characterId;

  // Fetch character data
  const { data: character, isLoading: characterLoading } = useQuery({
    queryKey: ['character', characterId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/characters/${characterId}`, undefined, {}, 'medium');
      return await response.json() as Character;
    },
    enabled: !!characterId,
  });

  // Fetch all character images (no limit)
  const { data: characterImages = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['character-images-all', characterId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/image-generation/character/${characterId}?all=true`, undefined, {}, 'medium');
      const result = await response.json();
      return result.data?.images || [];
    },
    enabled: !!characterId,
  });

  if (!match || !characterId) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Character Not Found</h1>
          <Link href="/generate-images">
            <Button className="bg-orange-500 hover:bg-orange-600">
              Back to Generate Images
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (characterLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const handleDownloadAll = async () => {
    if (characterImages.length === 0) return;

    try {
      // Create a zip download or download each image individually
      for (let i = 0; i < characterImages.length; i++) {
        const image = characterImages[i];
        const response = await fetch(image.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${character?.name || 'character'}-image-${i + 1}.webp`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Add a small delay between downloads to avoid overwhelming the browser
        if (i < characterImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Failed to download images:', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-16 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/generate-images?characterId=${characterId}&returnFromGallery=true`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Workshop
              </Button>
            </Link>
            
            {characterImages.length > 0 && (
              <Button 
                onClick={handleDownloadAll}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
              >
                <Download className="w-4 h-4" />
                Download All ({characterImages.length})
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {character?.avatar && (
              <img 
                src={character.avatar} 
                alt={character.name}
                className="w-16 h-16 rounded-lg object-cover border-2 border-orange-500/30"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                {character?.name} Gallery
              </h1>
              <p className="text-zinc-400 mt-1">
                All generated images for this character ({characterImages.length} total)
              </p>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <Card className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border border-orange-500/20 shadow-2xl shadow-orange-500/10">
          <CardContent className="p-6">
            {imagesLoading ? (
              <div className="text-center py-12">
                <LoadingSpinner />
                <p className="text-zinc-500 text-sm mt-4">Loading gallery...</p>
              </div>
            ) : characterImages.length > 0 ? (
              <GeneratedImages 
                images={characterImages.map((image: any, index: number) => ({ 
                  url: image.url, 
                  id: `gallery-${index}`,
                  filename: `${character?.name || 'character'}-image-${index + 1}.webp`
                }))}
                title={`Complete Gallery (${characterImages.length} images)`}
              />
            ) : (
              <div className="text-center py-12">
                <Grid className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <div className="text-zinc-400 text-lg mb-2">No images found</div>
                <div className="text-zinc-500 text-sm">
                  No images have been generated for this character yet.
                </div>
                <Link href={`/generate-images?characterId=${characterId}`}>
                  <Button className="mt-4 bg-orange-500 hover:bg-orange-600">
                    Generate Images
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CharacterGalleryPage;
