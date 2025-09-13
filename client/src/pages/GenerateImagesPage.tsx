import React, { useState, useEffect } from 'react';
import { ArrowLeft, Coins, Sparkles, Image as ImageIcon, Download, X, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import type { Character } from '@shared/api-types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Link, useLocation } from 'wouter';
import GeneratedImages from '@/components/ui/GeneratedImages';
import HorizontalImageCarousel from '@/components/ui/HorizontalImageCarousel';
import { filterContent, filterContentLenient, ViolationSeverity } from '@shared/content-filter';
import { violationTracker } from '@shared/violation-tracker';
import { useToast } from '@/hooks/use-toast';

const GenerateImagesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const { toast } = useToast();
  
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [bufferCards, setBufferCards] = useState<Array<{ id: string; isBuffer: boolean }>>([]); // Changed to array of buffer objects
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Content filtering state
  const [contentWarning, setContentWarning] = useState<string | null>(null);
  const [hasContentViolation, setHasContentViolation] = useState(false);


  // Image modal state management
  const [selectedImage, setSelectedImage] = useState<{ image: { url: string; id?: string; filename?: string }, groupImages: { url: string; id?: string; filename?: string }[], index: number } | null>(null);

  // Extract characterId from URL parameters and set as selected
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const characterIdParam = urlParams.get('characterId');
    const returnFromGallery = urlParams.get('returnFromGallery');
    
    if (characterIdParam) {
      setSelectedCharacterId(characterIdParam);
      
      // If returning from gallery, restore the saved prompt
      if (returnFromGallery === 'true') {
        const savedPrompt = localStorage.getItem('generate-images-prompt');
        const savedNegativePrompt = localStorage.getItem('generate-images-negative-prompt');
        const savedNumberOfImages = localStorage.getItem('generate-images-number');
        
        if (savedPrompt) {
          setPrompt(savedPrompt);
        }
        if (savedNegativePrompt) {
          setNegativePrompt(savedNegativePrompt);
        }
        if (savedNumberOfImages) {
          setNumberOfImages(parseInt(savedNumberOfImages, 10));
        }
        
        // Clean up localStorage and URL params
        localStorage.removeItem('generate-images-prompt');
        localStorage.removeItem('generate-images-negative-prompt');
        localStorage.removeItem('generate-images-number');
        
        // Update URL to remove the returnFromGallery parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('returnFromGallery');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, [location]);

  // Clear generated images when character changes
  useEffect(() => {
    setGeneratedImages([]);
  }, [selectedCharacterId]);

  // Cleanup effect to cancel ongoing generation when component unmounts
  useEffect(() => {
    return () => {
      if (currentJobId) {
        console.log('🧹 Component unmounting, canceling current job');
        setIsGenerating(false);
        setCurrentJobId(null);
      }
    };
  }, []); // Empty dependency array - only runs on mount/unmount

  // Fetch all characters for the dropdown
  const { data: characters = [], isLoading: charactersLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/characters?limit=1000', undefined, {}, 'medium');
      return await response.json() as Character[];
    },
  });

  // Fetch selected character data
  const { data: selectedCharacter } = useQuery({
    queryKey: ['character', selectedCharacterId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/characters/${selectedCharacterId}`, undefined, {}, 'medium');
      return await response.json() as Character;
    },
    enabled: !!selectedCharacterId,
  });

  // Fetch embedding availability for selected character
  const { data: embeddingInfo } = useQuery({
    queryKey: ['character-embeddings', selectedCharacterId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/image-generation/embeddings/${selectedCharacterId}`, undefined, {}, 'medium');
      const result = await response.json();
      // Transform the response to match expected format
      return {
        isReady: result.data?.hasEmbeddings || false,
        status: result.data?.status || 'unknown',
        totalImages: result.data?.totalImages || 0,
        message: result.data?.message || 'Checking...'
      };
    },
    enabled: !!selectedCharacterId,
  });

  // Fetch character images for Workshop display
  const { data: characterImages = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['character-images', selectedCharacterId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/image-generation/character/${selectedCharacterId}`, undefined, {}, 'medium');
      const result = await response.json();
      const images = result.data?.images || [];
      // Reverse the images to show newest first (since API returns oldest first)
      return images.reverse();
    },
    enabled: !!selectedCharacterId,
    refetchInterval: 30000, // Refetch every 30 seconds to show new images
  });

  // Pricing structure
  const pricing = {
    1: 6,
    2: 12,
    4: 24,
    8: 35,
  };

  const handleGenerateImages = async () => {
    if (!selectedCharacter || !prompt.trim() || !user) return;

    // Check if user is currently restricted
    const restrictionCheck = violationTracker.isUserRestricted(user.id.toString());
    if (restrictionCheck.isRestricted) {
      let message = '';
      switch (restrictionCheck.type) {
        case 'banned':
          message = `Your account has been permanently banned for severe content violations. This action cannot be reversed.`;
          break;
        case 'suspended':
          message = `Your account is suspended until ${restrictionCheck.expiresAt?.toLocaleString()}. Reason: ${restrictionCheck.reason}`;
          break;
        case 'restricted':
          message = `Your account is restricted until ${restrictionCheck.expiresAt?.toLocaleString()}. You cannot generate images during this time.`;
          break;
        default:
          message = 'Your account has been restricted due to content violations.';
      }
      
      toast({
        title: "Account Restricted",
        description: message,
        variant: "destructive",
      });
      return;
    }

    // Content filtering check
    const contentCheck = filterContent(prompt);
    if (!contentCheck.isAllowed) {
      // Log the violation
      violationTracker.logViolation({
        userId: user.id.toString(),
        username: user.username,
        violationType: 'content_filter',
        severity: contentCheck.severity,
        content: prompt,
        blockedWords: contentCheck.blockedWords,
        context: 'image_generation',
        userAgent: navigator.userAgent
      });

      // Show appropriate message based on severity
      toast({
        title: contentCheck.severity === ViolationSeverity.CRITICAL ? "Account Banned" : "Content Blocked",
        description: contentCheck.message,
        variant: "destructive",
      });

      setContentWarning(contentCheck.message || null);
      setHasContentViolation(true);

      // For critical violations, immediately redirect or disable account
      if (contentCheck.shouldBan) {
        // In a real app, you'd redirect to a ban page or logout
        setTimeout(() => {
          toast({
            title: "Account Terminated",
            description: "Your account has been permanently terminated. You will be redirected shortly.",
            variant: "destructive",
          });
        }, 2000);
      }

      return;
    }

    // Clear any previous content warnings
    setContentWarning(null);
    setHasContentViolation(false);

    // Prevent multiple simultaneous generations
    if (isGenerating) {
      console.log('⚠️ Generation already in progress, please wait...');
      return;
    }

    setIsGenerating(true);
    setCurrentImageIndex(1); // Start at 1 to show "Generating 1 of X"
    
    // Create a single buffer card for the new generation
    const newBufferCard = {
      id: `buffer-${Date.now()}`,
      isBuffer: true
    };
    setBufferCards([newBufferCard]); // Only one buffer at a time
    
    try {
      // Get the character's original art style for model consistency
      // Check if character has enhanced creation data (new characters) or fallback to anime
      const characterArtStyle = (selectedCharacter as any).artStyle?.primaryStyle || 'anime';
      const characterModel = (selectedCharacter as any).imageGeneration?.model || null;
      
      console.log('🎨 Using character art style:', characterArtStyle);
      console.log('🤖 Using character model:', characterModel);
      console.log(`🖼️ Generating ${numberOfImages} images...`);


      // Send a single request with the quantity parameter for batch generation
      const response = await apiRequest('POST', '/api/image-generation/generate', {
        prompt,
        negativePrompt,
        characterId: selectedCharacterId,
        characterName: selectedCharacter.name,
        characterPersona: selectedCharacter.persona,
        width: 1024,
        height: 1536,
        steps: 25,
        cfgScale: 8,
        artStyle: characterArtStyle, // Use character's original art style for model selection
        model: characterModel, // Use character's original model if available
        nsfw: selectedCharacter.isNsfw || false,
        quantity: numberOfImages, // Send quantity for batch generation with coin deduction
        loras: lorasForRequest // Include selected LoRAs
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Handle the async job response
        const jobId = result.data.jobId;
        setCurrentJobId(jobId);
        console.log(`✅ Image generation job started: ${jobId}`);
        
        // Poll for job completion with exponential backoff
        let pollCount = 0;
        const maxPollCount = 150; // Maximum 5 minutes of polling
        let isPollingActive = true; // Local flag to control polling
        
        const pollJobStatus = async () => {
          // Check if polling should continue
          if (!isPollingActive) {
            console.log('⚠️ Polling cancelled for job:', jobId);
            return;
          }
          
          console.log(`🔍 Polling job ${jobId} - attempt ${pollCount + 1}/${maxPollCount}`);
          
          try {
            const statusResponse = await apiRequest('GET', `/api/image-generation/jobs/${jobId}`, undefined, {}, 'low');
            const statusResult = await statusResponse.json();
            
            if (statusResult.success) {
              const jobData = statusResult.data;
              
              if (jobData.status === 'completed' && jobData.result) {
                // Job completed successfully
                isPollingActive = false;
                const imageUrls = jobData.result.imageUrls || [jobData.result.imageUrl];
                
                // Clear buffer and add new images to existing ones (don't replace)
                setBufferCards([]); // Clear buffer
                setGeneratedImages(prev => [...imageUrls, ...prev]); // Add new images to front but keep existing ones
                console.log(`✅ Generated ${imageUrls.length} new images successfully. Total generated: ${imageUrls.length + generatedImages.length}`);
                
                setIsGenerating(false);
                setCurrentImageIndex(0);
                setCurrentJobId(null);
                
                // Refetch character images to show the newly generated ones in the gallery
                queryClient.invalidateQueries({ queryKey: ['character-images', selectedCharacterId] });
                return; // Stop polling
              } else if (jobData.status === 'failed') {
                isPollingActive = false;
                console.error('❌ Image generation failed:', jobData.error);
                setIsGenerating(false);
                setCurrentImageIndex(0);
                setCurrentJobId(null);
                setBufferCards([]); // Clear buffer cards on failure
                return; // Stop polling
              } else {
                // Job still in progress, update progress
                const currentProgress = jobData.progress || 0;
                const currentIndex = Math.max(1, Math.ceil(currentProgress * numberOfImages / 100));
                setCurrentImageIndex(currentIndex);
                console.log(`🔄 Generation progress: ${currentProgress}% (${currentIndex}/${numberOfImages})`);
              }
            }
          } catch (pollError) {
            console.error('❌ Error polling job status:', pollError);
            // Don't stop polling on error, just log it
          }
          
          // Continue polling if job is still in progress
          pollCount++;
          if (pollCount < maxPollCount && isPollingActive) {
            // Use exponential backoff: start with 3 seconds, increase gradually
            const delay = Math.min(3000 + (pollCount * 500), 10000); // Max 10 seconds between polls
            setTimeout(pollJobStatus, delay);
          } else {
            // Timeout reached
            isPollingActive = false;
            if (pollCount >= maxPollCount) {
              console.error('❌ Job polling timeout after 5 minutes');
            }
            setIsGenerating(false);
            setCurrentImageIndex(0);
            setCurrentJobId(null);
            setBufferCards([]); // Clear buffer cards on timeout
          }
        };
        
        // Start polling after a short delay
        setTimeout(pollJobStatus, 3000);

        
      } else {
        console.error('❌ Image generation failed:', result.error);
        setIsGenerating(false);
        setCurrentImageIndex(0);
        setCurrentJobId(null);
        setBufferCards([]); // Clear buffer cards on API failure
      }
      
    } catch (error) {
      console.error('❌ Error generating images:', error);
      setIsGenerating(false);
      setCurrentImageIndex(0);
      setCurrentJobId(null);
      setBufferCards([]); // Clear buffer cards on error
      
      // Could show user-friendly error message here
      // For now, just log the error
    }
  };

  const currentCost = pricing[numberOfImages as keyof typeof pricing];


  // Image modal functions
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

  const openImageModal = (image: { url: string; id?: string; filename?: string }, groupImages: { url: string; id?: string; filename?: string }[], index: number) => {
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

  return (
    <div className="pb-20 pt-20 fixed inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20 text-white overflow-hidden">
      <div className="flex flex-col h-full overflow-y-auto lg:overflow-hidden">
        {/* Header Navigation */}
        <div className="flex-shrink-0 p-4 sm:p-6 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <Link href="/gallery">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white w-fit">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Gallery
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-orange-400">
              <Coins className="w-5 h-5" />
              <span className="font-semibold">{user?.coins || 0} coins</span>
            </div>
          </div>
          
          {/* SEO-optimized main heading and description */}
          <div className="mt-4 mb-2 max-w-4xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-3 leading-tight">
              AI Image Generator - Create Custom Character Art
            </h1>
            
            {/* Mobile-first layout: stack vertically on small screens, side-by-side on larger screens */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-2">
              <div className="flex-1">
                <p className="text-zinc-300 text-sm lg:text-base leading-relaxed">
                  Generate stunning AI images and artwork with your favorite characters. Create custom NSFW and SFW images using advanced AI technology.
                </p>
              </div>
              
              {/* User Responsibility Disclaimer - Full width on mobile, fixed width on desktop */}
              <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg text-xs lg:flex-shrink-0 lg:max-w-xs">
                <h4 className="text-red-400 font-semibold text-xs mb-1">⚠️ User Responsibility</h4>
                <p className="text-gray-300 text-xs leading-relaxed">
                  You are <strong>100% responsible</strong> for all generated content. 
                  <Link href="/legal/liability-disclaimer" className="text-blue-400 hover:text-blue-300 underline ml-1 break-words">
                    Read disclaimer
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 px-4 sm:px-6 pb-6 mb-0 lg:h-[calc(100vh-120px)] lg:overflow-hidden items-stretch">

          {/* Left Panel - Wide Control Box */}
          <div className="w-full lg:w-[28rem] flex-shrink-0 flex flex-col lg:h-[65vh]">
            <Card className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border-orange-500/20 flex-1 flex flex-col lg:h-full">
              <CardContent className="p-3 sm:p-4 lg:p-2 space-y-3 sm:space-y-4 lg:space-y-1 lg:overflow-y-auto flex-col flex-1 lg:h-full">
                {/* Header with Character Selection */}
                <div className="space-y-3 sm:space-y-4 flex-shrink-0">
                  {selectedCharacter ? (
                    <div className="flex items-center gap-3 mb-3 lg:mb-4">
                      <img
                        src={selectedCharacter.avatar || selectedCharacter.avatarUrl || '/fallback.jpg'}
                        alt={selectedCharacter.name}
                        className="w-10 lg:w-12 h-10 lg:h-12 rounded-full object-cover ring-2 ring-orange-500/30"
                      />
                      <div className="min-w-0 flex-1">
                        <h1 className="text-base lg:text-lg font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent leading-tight">
                          Generate Images for {selectedCharacter.name}
                        </h1>
                        <p className="text-zinc-400 text-xs lg:text-sm">Create stunning images</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mb-3 lg:mb-4">
                      <div className="w-10 lg:w-12 h-10 lg:h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                        <ImageIcon className="w-5 lg:w-6 h-5 lg:h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-base lg:text-lg font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                          Generate Images
                        </h1>
                        <p className="text-zinc-400 text-xs lg:text-sm">Create stunning images</p>
                      </div>
                    </div>
                  )}

                  {/* Character Selection Dropdown */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-orange-400" />
                      Select Character
                    </h3>
                    {charactersLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner size="sm" text="Loading characters..." />
                      </div>
                    ) : (
                      <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
                        <SelectTrigger className="w-full bg-zinc-800/50 border-zinc-600/30 focus:border-orange-500">
                          <SelectValue placeholder="Choose a character to generate images with..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-600/30 max-h-64 overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-md">
                          {characters.map((character) => (
                            <SelectItem 
                              key={character.id} 
                              value={character.id}
                              className="focus:bg-orange-500/20 focus:text-orange-300"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <img
                                  src={character.avatar || character.avatarUrl || '/fallback.jpg'}
                                  alt={character.name}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                                <span className="truncate">{character.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Embedding Status Section */}
                  {selectedCharacterId && (
                    <div className="mt-4 p-3 rounded-lg border border-zinc-600/30 bg-zinc-800/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-400">Character Embedding Status</span>
                      </div>
                      {embeddingInfo ? (
                        <div className="flex items-center gap-2">
                          {embeddingInfo.isReady ? (
                            <>
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-sm text-green-400">Ready for image generation</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                              <span className="text-sm text-yellow-400">
                                Image creation will be available in less than 2 minutes
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"></div>
                          <span className="text-sm text-zinc-400">Checking embedding status...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Prompt Section */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-orange-400" />
                    Prompt
                  </h3>
                  <Textarea
                    placeholder="Describe what you want to see in your image. Tip: Start your prompt with a subject (e.g. A fantasy sorcerer standing in a mystical library...)"
                    value={prompt}
                    onChange={(e) => {
                      const newPrompt = e.target.value;
                      setPrompt(newPrompt);
                      
                      // Real-time content filtering (lenient for typing)
                      if (newPrompt.trim()) {
                        const contentCheck = filterContentLenient(newPrompt);
                        setContentWarning(contentCheck.isAllowed ? null : contentCheck.message || null);
                        setHasContentViolation(!contentCheck.isAllowed);
                      } else {
                        setContentWarning(null);
                        setHasContentViolation(false);
                      }
                    }}
                    className={`min-h-[100px] sm:min-h-[120px] bg-zinc-800/50 resize-none text-sm lg:text-base transition-colors ${
                      hasContentViolation 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-zinc-600 focus:border-orange-500'
                    }`}
                    disabled={!selectedCharacterId}
                  />
                  {!selectedCharacterId && (
                    <p className="text-sm text-zinc-500 mt-1">Please select a character first</p>
                  )}
                  {contentWarning && (
                    <div className="mt-2 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle size={16} />
                        <span className="text-sm font-medium">Content Warning</span>
                      </div>
                      <p className="text-sm text-red-300 mt-1">{contentWarning}</p>
                    </div>
                  )}
                </div>

                {/* Negative Prompt Section */}
                {/* <div>
                  <h3 className="text-lg font-semibold mb-2">Negative Prompt</h3>
                  <Textarea
                    placeholder="Describe what you do not want to see in your image"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="min-h-[40px] bg-zinc-800/50 border-zinc-600 focus:border-orange-500 resize-none text-sm"
                    disabled={!selectedCharacterId}
                  />
                </div> */}


                {/* Number of Images & Generate */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Number of Images</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                    {Object.entries(pricing).map(([count, cost]) => (
                      <button
                        key={count}
                        onClick={() => setNumberOfImages(parseInt(count))}
                        disabled={!selectedCharacterId}
                        className={`p-2 sm:p-1 rounded-lg border-2 transition-all duration-200 ${
                          numberOfImages === parseInt(count)
                            ? 'border-orange-500 bg-orange-500/20'
                            : 'border-zinc-600 hover:border-orange-400'
                        } ${!selectedCharacterId ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-center">
                          <div className="text-sm font-bold">{count}</div>
                          <div className="text-xs text-zinc-400 flex items-center justify-center gap-1">
                            <Coins className="w-2 h-2" />
                            {cost}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={handleGenerateImages}
                    disabled={
                      !selectedCharacterId || 
                      !prompt.trim() || 
                      isGenerating || 
                      hasContentViolation ||
                      (user?.coins || 0) < currentCost ||
                      (embeddingInfo && !embeddingInfo.isReady)
                    }
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Generating {currentImageIndex} of {numberOfImages}...
                      </div>
                    ) : hasContentViolation ? (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Content Blocked - Fix Prompt
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Generate {numberOfImages} Image{numberOfImages > 1 ? 's' : ''} ({currentCost} coins)
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Fixed Workshop Area */}
          <div className="flex-1 min-w-0 order-2 lg:order-2 lg:overflow-hidden flex flex-col lg:h-[65vh] min-h-[400px]">
            <Card className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-lg border-orange-500/20 flex-1 flex flex-col lg:h-full">
              <CardContent className="p-3 sm:p-4 flex flex-col flex-1 lg:h-full">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 flex-shrink-0">
                  <ImageIcon className="w-4 sm:w-5 h-4 sm:h-5 text-orange-400" />
                  Workshop
                </h3>
                
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                  {generatedImages.length === 0 && bufferCards.length === 0 && characterImages.length === 0 ? (
                    <div className="text-center px-4">
                      <ImageIcon className="w-12 sm:w-16 lg:w-24 h-12 sm:h-16 lg:h-24 mx-auto mb-3 sm:mb-4 lg:mb-6 opacity-30 text-zinc-400" />
                      <p className="text-lg sm:text-xl lg:text-3xl font-medium mb-2 lg:mb-4 text-zinc-400">Your Creative Workshop</p>
                      <p className="text-sm sm:text-base lg:text-xl mb-2 lg:mb-3 text-zinc-500">Generated images will appear here</p>
                      {!selectedCharacterId && (
                        <p className="text-xs sm:text-sm lg:text-lg text-zinc-600 mt-2 lg:mt-4">Select a character and start creating amazing images</p>
                      )}
                    </div>
                  ) : (
                    <div className="w-full">
                      <HorizontalImageCarousel 
                        images={[
                          // Add buffer cards first (they will be replaced when images are ready)
                          ...bufferCards.map((buffer) => ({ 
                            url: '', 
                            id: buffer.id,
                            isBuffer: true
                          })),
                          // Add all generated images (not just when no buffer)
                          ...generatedImages.map((url, index) => ({ 
                            url, 
                            id: `generated-${index}`,
                            filename: `generated-image-${Date.now()}-${index + 1}.webp`
                          })),
                          // Add existing character images (limited to 8, only if no generated images and no generation happening)
                          ...(generatedImages.length === 0 && bufferCards.length === 0 ? characterImages.slice(0, 8).map((img: any, index: number) => ({
                            url: img.url,
                            id: `existing-${index}`,
                            filename: img.filename || `character-image-${index + 1}.webp`
                          })) : [])
                        ]}
                        title={
                          bufferCards.length > 0
                            ? `Generating Images...`
                            : generatedImages.length > 0 
                              ? `Generated Images (${generatedImages.length})`
                              : characterImages.length > 0 
                                ? `Character Images (${characterImages.length})`
                                : undefined
                        }
                        onImageClick={(image) => {
                          const allImages = [
                            ...generatedImages.map((url, index) => ({ 
                              url, 
                              id: `generated-${index}`,
                              filename: `generated-image-${Date.now()}-${index + 1}.webp`
                            })),
                            ...(generatedImages.length === 0 && bufferCards.length === 0 ? characterImages.slice(0, 8).map((img: any, index: number) => ({
                              url: img.url,
                              id: `existing-${index}`,
                              filename: img.filename || `character-image-${index + 1}.webp`
                            })) : [])
                          ];
                          const imageIndex = allImages.findIndex(img => img.id === image.id);
                          if (imageIndex !== -1) {
                            openImageModal(image, allImages, imageIndex);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-8"
            onClick={closeImageModal}
          >
            <div 
              className="relative bg-zinc-800/90 backdrop-blur-md rounded-lg w-full h-auto max-w-4xl max-h-[90vh] overflow-hidden border border-orange-500/30 flex flex-col"
              style={{
                maxWidth: 'calc(100vw - 32px)', // Full width minus padding (16px on each side)
                maxHeight: 'calc(100vh - 160px)', // Account for header/footer space
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-2 sm:p-4 border-b border-orange-500/20 flex-shrink-0">
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold text-sm sm:text-base truncate">Generated Image</h3>
                  <p className="text-zinc-300 text-xs sm:text-sm">
                    Image {selectedImage.index + 1} of {selectedImage.groupImages.length}
                  </p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => downloadImage(
                      selectedImage.image.url, 
                      selectedImage.image.filename || `generated-image-${selectedImage.index + 1}.png`
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
              <div className="relative flex-1 flex items-center justify-center p-4">
                <img 
                  src={selectedImage.image.url} 
                  alt={`Generated image ${selectedImage.index + 1}`}
                  className="max-w-full max-h-full object-contain mx-auto block"
                  style={{
                    maxWidth: 'calc(100vw - 96px)', // Account for modal padding and container padding
                    maxHeight: 'calc(100vh - 240px)', // Account for header, footer space, and modal header
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
};

export default GenerateImagesPage;


