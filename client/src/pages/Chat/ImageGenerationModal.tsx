// src/pages/Chat/ImageGenerationModal.tsx
import { useState } from "react";
import { X, Sparkles, ImageIcon, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { Character } from '@shared/api-types';
import type { LoRAContext } from '../../types/lora';
import { checkProhibitedWords } from '@/lib/prohibitedWordsFilter';

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (imageUrl: string, prompt: string, messageId?: string) => void;
  onImageGenerationStarted?: (prompt: string, jobId: string) => string; // Returns messageId
  onImageGenerationFailed?: (messageId?: string) => void;
  characterId: string;
  characterName: string;
  disabled?: boolean;
  loraContext?: LoRAContext;
}

export default function ImageGenerationModal({
  isOpen,
  onClose,
  onImageGenerated,
  onImageGenerationStarted,
  onImageGenerationFailed,
  characterId,
  characterName,
  disabled = false,
  loraContext
}: ImageGenerationModalProps) {
  const [prompt, setPrompt] = useState("");
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [contentWarning, setContentWarning] = useState<string | null>(null);
  const [hasContentViolation, setHasContentViolation] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch selected character data (matching GenerateImagesPage)
  const { data: selectedCharacter } = useQuery({
    queryKey: ['character', characterId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/characters/${characterId}`, undefined, {}, 'medium');
      return await response.json() as Character;
    },
    enabled: !!characterId,
  });

  // Pricing structure - only 1 image option for chat
  const pricing = {
    1: 6,
  } as const;

  const currentCost = pricing[numberOfImages as keyof typeof pricing] || 3;

  const handleGenerateImage = async () => {
    if (!selectedCharacter || !prompt.trim() || isGenerating || !user) return;

    // Check for prohibited words in the prompt
    const prohibitedWordsCheck = checkProhibitedWords(prompt.trim());
    if (!prohibitedWordsCheck.isAllowed) {
      toast({
        title: "Prompt Blocked",
        description: prohibitedWordsCheck.message,
        variant: "destructive"
      });
      setContentWarning(prohibitedWordsCheck.message);
      setHasContentViolation(true);
      return;
    }

    // Clear any previous warnings
    setContentWarning(null);
    setHasContentViolation(false);

    if ((user.coins || 0) < currentCost) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${currentCost} coins to generate ${numberOfImages} image${numberOfImages > 1 ? 's' : ''}.`,
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Close modal immediately and show generating status
    onClose();
    
    toast({
      title: "Image is being generated",
      description: `Creating ${numberOfImages} image${numberOfImages > 1 ? 's' : ''} with ${characterName}`,
    });

    let messageId: string | undefined; // Move to function scope

    try {
      // Get character model and art style from character data
      const characterArtStyle = (selectedCharacter as any).artStyle?.primaryStyle || 'anime';
      const characterModel = (selectedCharacter as any).imageGeneration?.model || null;
      
      console.log('🤖 Using character model:', characterModel);
      console.log(`🖼️ Generating ${numberOfImages} images...`);

      // Send a single request with the quantity parameter (exact copy from GenerateImagesPage)
      const response = await apiRequest('POST', '/api/image-generation/generate', {
        prompt: prompt.trim(),
        negativePrompt: '', // Empty for chat modal
        characterId: characterId,
        characterName: selectedCharacter.name,
        characterPersona: selectedCharacter.persona,
        width: 1024,
        height: 1536,
        steps: 25,
        cfgScale: 8,
        artStyle: characterArtStyle,
        model: characterModel,
        nsfw: selectedCharacter.isNsfw || false,
        quantity: numberOfImages,
        // Add LoRA parameters if available
        ...(loraContext?.selectedLora && loraContext.isActive ? {
          loraModel: loraContext.selectedLora.filename,
          loraStrength: loraContext.strength
        } : {})
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Handle the async job response
        const jobId = result.data.jobId;
        setCurrentJobId(jobId);
        console.log(`✅ Image generation job started: ${jobId}`);
        
        // Add loading message to chat immediately
        if (onImageGenerationStarted) {
          messageId = onImageGenerationStarted(prompt.trim(), jobId);
        }
        
        // Poll for job completion (optimized for faster chat response)
        let pollCount = 0;
        const maxPollCount = 120; // Maximum 2 minutes of polling
        let isPollingActive = true;
        
        const pollJobStatus = async () => {
          if (!isPollingActive) return;
          
          try {
            const statusResponse = await apiRequest('GET', `/api/image-generation/jobs/${jobId}`);
            const statusResult = await statusResponse.json();
            
            if (statusResult.success) {
              const jobStatus = statusResult.data;
              
              if (jobStatus.status === 'completed' && jobStatus.result && jobStatus.result.imageUrls && jobStatus.result.imageUrls.length > 0) {
                // Job completed successfully
                isPollingActive = false;
                setIsGenerating(false);
                setCurrentJobId(null);
                
                // For chat, use the first generated image
                const firstImageUrl = jobStatus.result.imageUrls[0];
                onImageGenerated(firstImageUrl, prompt.trim(), messageId);
                
                toast({
                  title: "Image Generated Successfully!",
                  description: `Created ${jobStatus.result.imageUrls.length} image${jobStatus.result.imageUrls.length > 1 ? 's' : ''} for ${characterName}`,
                });

                // Reset form
                setPrompt("");
                setNumberOfImages(1);
                return;
              } else if (jobStatus.status === 'failed') {
                // Job failed
                isPollingActive = false;
                if (onImageGenerationFailed && messageId) {
                  onImageGenerationFailed(messageId);
                }
                throw new Error(jobStatus.error || 'Image generation failed');
              }
            }
          } catch (pollError) {
            console.error('❌ Error polling job status:', pollError);
          }
          
          // Continue polling if job is still in progress
          pollCount++;
          if (pollCount < maxPollCount && isPollingActive) {
            // Faster polling for chat: start at 1 second, max 3 seconds
            const delay = Math.min(1000 + (pollCount * 200), 3000);
            setTimeout(pollJobStatus, delay);
          } else {
            // Timeout reached
            isPollingActive = false;
            if (pollCount >= maxPollCount) {
              console.error('❌ Job polling timeout after 2 minutes');
              if (onImageGenerationFailed && messageId) {
                onImageGenerationFailed(messageId);
              }
            }
            setIsGenerating(false);
            setCurrentJobId(null);
          }
        };
        
        // Start polling immediately for faster response
        setTimeout(pollJobStatus, 1000);
        
      } else {
        throw new Error(result.error || 'Image generation failed');
      }
      
    } catch (error) {
      console.error('Image generation error:', error);
      setIsGenerating(false);
      setCurrentJobId(null);
      
      // Remove loading message if it was added
      if (onImageGenerationFailed && messageId) {
        onImageGenerationFailed(messageId);
      }
      
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-zinc-800/95 to-zinc-900/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl shadow-2xl shadow-orange-500/20 w-full max-w-md my-8 mx-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Generate Image</h2>
                <p className="text-sm text-zinc-400">Create with {characterName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {/* Prompt Section */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 text-orange-400" />
                Prompt
              </h3>
              <Textarea
                placeholder={`Describe what you want to see with ${characterName}...`}
                value={prompt}
                onChange={(e) => {
                  const newPrompt = e.target.value;
                  setPrompt(newPrompt);
                  
                  // Real-time content filtering
                  if (newPrompt.trim()) {
                    const prohibitedWordsCheck = checkProhibitedWords(newPrompt);
                    if (!prohibitedWordsCheck.isAllowed) {
                      setContentWarning(prohibitedWordsCheck.message);
                      setHasContentViolation(true);
                    } else {
                      setContentWarning(null);
                      setHasContentViolation(false);
                    }
                  } else {
                    setContentWarning(null);
                    setHasContentViolation(false);
                  }
                }}
                className={`min-h-[80px] bg-zinc-800/50 border-zinc-600 focus:border-orange-500 resize-none text-white text-sm ${
                  hasContentViolation ? 'border-red-500/50 focus:border-red-500' : ''
                }`}
                disabled={isGenerating}
              />
            </div>

            {/* Content Warning Display */}
            {contentWarning && (
              <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle size={14} />
                  <span className="text-xs font-medium">Content Warning</span>
                </div>
                <p className="text-xs text-red-300 mt-1">{contentWarning}</p>
              </div>
            )}

            {/* LoRA Status Indicator */}
            {loraContext?.selectedLora && loraContext.isActive && (
              <div className="p-3 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-purple-300 font-medium">LoRA Active:</span>
                  <span className="text-white">{loraContext.selectedLora.name}</span>
                  <span className="text-purple-400">({(loraContext.strength * 100).toFixed(0)}%)</span>
                </div>
              </div>
            )}

            {/* Number of Images - Fixed to 1 for chat */}
            <div className="text-center text-sm text-zinc-400">
              Generating 1 image (6 coins)
            </div>

            {/* User Coins Display */}
            <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg border border-zinc-600/30">
              <span className="text-zinc-300 text-sm">Your coins:</span>
              <span className="font-semibold text-orange-400">{user?.coins || 0} 🪙</span>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateImage}
              disabled={
                !prompt.trim() || 
                isGenerating || 
                hasContentViolation ||
                (user?.coins || 0) < currentCost
              }
              className={`w-full font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                hasContentViolation
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
              } text-white`}
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Generating...</span>
                </div>
              ) : hasContentViolation ? (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Prompt Contains Restricted Content</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm">Generate Image (6 coins)</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
