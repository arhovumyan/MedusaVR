import React, { useState } from 'react';
import { Wand2, Download, Sparkles, Settings, ImageIcon, RefreshCw } from 'lucide-react';
import { EyeIcon } from './icons/EyeIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useGenerateImage, useImageModels } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { GenerateImageRequest } from '../../../shared/api-types';

interface CharacterImageGeneratorProps {
  characterName?: string;
  characterPersona?: string;
  characterId?: string;
  isMature?: boolean;
  onImageSelect?: (imageUrl: string) => void;
  className?: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  isSelected: boolean;
}

export function CharacterImageGenerator({
  characterName = '',
  characterPersona = '',
  characterId,
  isMature = false,
  onImageSelect,
  className = ''
}: CharacterImageGeneratorProps) {
  const { toast } = useToast();
  
  // API hooks
  const generateImageMutation = useGenerateImage();
  const { data: imageModels } = useImageModels();

  // Local state
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [selectedDimensions, setSelectedDimensions] = useState('1024x1536'); // Default to 1024x1536 for better quality
  const [quantity, setQuantity] = useState(1); // New state for image quantity
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced options
  const [negativePrompt, setNegativePrompt] = useState('low quality, blurry, distorted');
  const [cfgScale, setCfgScale] = useState(7);
  const [steps, setSteps] = useState(20);
  const [useGothicLora, setUseGothicLora] = useState(false);
  const [loraStrength, setLoraStrength] = useState(0.8);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for the image you want to generate.",
        variant: "destructive",
      });
      return;
    }

    const [width, height] = selectedDimensions.split('x').map(Number);

    const request: GenerateImageRequest = {
      prompt: prompt.trim(),
      style: selectedStyle,
      width,
      height,
      characterName: characterName || undefined,
      characterPersona: characterPersona || undefined,
      characterId: characterId || undefined,
      mature: isMature,
      quantity: quantity,
      negativePrompt: showAdvanced ? negativePrompt : undefined,
      steps: showAdvanced ? steps : undefined,
      cfgScale: showAdvanced ? cfgScale : undefined,
      useGothicLora: useGothicLora,
      loraStrength: useGothicLora ? loraStrength : undefined,
    };

    try {
      const result = await generateImageMutation.mutateAsync(request);
      
      if (result.success && result.data) {
        const newImage: GeneratedImage = {
          id: result.data.imageId,
          url: result.data.imageUrl,
          prompt: result.data.prompt,
          style: result.data.style || selectedStyle,
          isSelected: false
        };

        setGeneratedImages(prev => [newImage, ...prev]);
        
        toast({
          title: "Image generated successfully!",
          description: "Your character image has been created.",
        });

        // Auto-switch to gallery tab to show the result
        setActiveTab('gallery');
      }
    } catch (error: any) {
      // Handle content moderation violations specifically
      if (error?.status === 400 && error?.response) {
        try {
          const errorData = await error.response.json();
          if (errorData.code === 'IMAGE_CONTENT_VIOLATION') {
            toast({
              title: "Content Policy Violation",
              description: errorData.message || "Your image prompt contains inappropriate content. Please review our content guidelines.",
              variant: "destructive",
            });
            return;
          }
        } catch (jsonError) {
          // Fall through to generic error handling
        }
      }

      // Handle account bans
      if (error?.status === 403 && error?.response) {
        try {
          const errorData = await error.response.json();
          if (errorData.banned) {
            toast({
              title: errorData.error || "Account Banned",
              description: errorData.message || "Your account has been banned for violating our Terms of Service.",
              variant: "destructive",
            });
            return;
          }
        } catch (jsonError) {
          // Fall through to generic error handling
        }
      }

      // Generic error handling
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setGeneratedImages(prev => 
      prev.map(img => ({ ...img, isSelected: img.url === imageUrl }))
    );
    
    if (onImageSelect) {
      onImageSelect(imageUrl);
    }

    toast({
      title: "Image selected",
      description: "This image will be used as your character's avatar.",
    });
  };

  const getSmartPromptSuggestion = () => {
    const baseSuggestions = [
      `portrait of ${characterName || 'character'}`,
      `${characterName || 'character'} headshot`,
      `professional portrait of ${characterName || 'character'}`,
      `${characterName || 'character'} avatar`,
    ];

    if (characterPersona) {
      const personaKeywords = characterPersona.toLowerCase();
      if (personaKeywords.includes('warrior') || personaKeywords.includes('fighter')) {
        baseSuggestions.push(`${characterName || 'character'} in armor`);
      }
      if (personaKeywords.includes('magic') || personaKeywords.includes('wizard')) {
        baseSuggestions.push(`${characterName || 'character'} with magical aura`);
      }
      if (personaKeywords.includes('elegant') || personaKeywords.includes('noble')) {
        baseSuggestions.push(`elegant portrait of ${characterName || 'character'}`);
      }
    }

    return baseSuggestions;
  };

  const promptSuggestions = getSmartPromptSuggestion();

  return (
    <Card className={`bg-zinc-800/50 border-orange-500/20 ${className}`}>
      <CardHeader>
        <CardTitle className="text-orange-400 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Image Generation
        </CardTitle>
        <p className="text-sm text-zinc-400">
          Generate custom character images using AI
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Gallery {generatedImages.length > 0 && `(${generatedImages.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            {/* Prompt Suggestions */}
            {promptSuggestions.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Quick Suggestions</Label>
                <div className="flex flex-wrap gap-2">
                  {promptSuggestions.slice(0, 4).map((suggestion, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className="cursor-pointer hover:bg-orange-500/20 text-xs"
                      onClick={() => setPrompt(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Main Prompt Input */}
            <div>
              <Label htmlFor="prompt" className="text-sm font-medium">Image Description</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the character image you want to generate..."
                className="mt-1 bg-zinc-700/50 border-zinc-600 min-h-[80px]"
              />
            </div>

            {/* Style and Dimensions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="style" className="text-sm font-medium">Art Style</Label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger className="mt-1 bg-zinc-700/50 border-zinc-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageModels?.availableStyles?.map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        <div>
                          <div className="font-medium">{style.name}</div>
                          <div className="text-xs text-zinc-400">{style.description}</div>
                        </div>
                      </SelectItem>
                    )) || [
                      <SelectItem key="realistic" value="realistic">Realistic</SelectItem>,
                      <SelectItem key="anime" value="anime">Anime</SelectItem>,
                      <SelectItem key="fantasy" value="fantasy">Fantasy</SelectItem>
                    ]}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dimensions" className="text-sm font-medium">Dimensions</Label>
                <Select value={selectedDimensions} onValueChange={setSelectedDimensions}>
                  <SelectTrigger className="mt-1 bg-zinc-700/50 border-zinc-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageModels?.availableDimensions?.map((dim) => (
                      <SelectItem key={`${dim.width}x${dim.height}`} value={`${dim.width}x${dim.height}`}>
                        {dim.name}
                      </SelectItem>
                    )) || [
                      <SelectItem key="512x512" value="512x512">Square (512x512)</SelectItem>,
                      <SelectItem key="768x768" value="768x768">Square HD (768x768)</SelectItem>,
                      <SelectItem key="512x768" value="512x768">Portrait (512x768)</SelectItem>,
                      <SelectItem key="768x512" value="768x512">Landscape (768x512)</SelectItem>
                    ]}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity" className="text-sm font-medium">Quantity</Label>
                <Select value={String(quantity)} onValueChange={(value) => setQuantity(Number(value))}>
                  <SelectTrigger className="mt-1 bg-zinc-700/50 border-zinc-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Image (6 Coins)</SelectItem>
                    <SelectItem value="2">2 Images (12 Coins)</SelectItem>
                    <SelectItem value="4">4 Images (24 Coins)</SelectItem>
                    <SelectItem value="8">8 Images (35 Coins)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
                id="advanced"
              />
              <Label htmlFor="advanced" className="text-sm">Advanced Options</Label>
            </div>

            {showAdvanced && (
              <div className="space-y-4 p-4 border border-zinc-700 rounded-lg">
                <div>
                  <Label htmlFor="negativePrompt" className="text-sm font-medium">Negative Prompt</Label>
                  <Input
                    id="negativePrompt"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="Things to avoid in the image..."
                    className="mt-1 bg-zinc-700/50 border-zinc-600"
                  />
                </div>

                {/* LoRA Style Toggle */}
                <div className="space-y-3 p-3 border border-zinc-600 rounded-lg bg-zinc-800/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="gothicLora" className="text-sm font-medium text-orange-400">Gothic Style LoRA</Label>
                      <p className="text-xs text-zinc-400 mt-1">Apply gothic aesthetic with dark fantasy styling</p>
                    </div>
                    <Switch
                      checked={useGothicLora}
                      onCheckedChange={setUseGothicLora}
                      id="gothicLora"
                    />
                  </div>
                  
                  {useGothicLora && (
                    <div>
                      <Label htmlFor="loraStrength" className="text-sm font-medium">
                        LoRA Strength: {loraStrength.toFixed(1)}
                      </Label>
                      <input
                        type="range"
                        id="loraStrength"
                        min="0.1"
                        max="1.5"
                        step="0.1"
                        value={loraStrength}
                        onChange={(e) => setLoraStrength(Number(e.target.value))}
                        className="w-full mt-1"
                      />
                      <div className="flex justify-between text-xs text-zinc-400 mt-1">
                        <span>Subtle (0.1)</span>
                        <span>Strong (1.5)</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="steps" className="text-sm font-medium">Steps: {steps}</Label>
                    <input
                      type="range"
                      id="steps"
                      min="10"
                      max="50"
                      value={steps}
                      onChange={(e) => setSteps(Number(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cfgScale" className="text-sm font-medium">CFG Scale: {cfgScale}</Label>
                    <input
                      type="range"
                      id="cfgScale"
                      min="1"
                      max="20"
                      value={cfgScale}
                      onChange={(e) => setCfgScale(Number(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerateImage}
              disabled={!prompt.trim() || generateImageMutation.isPending}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              {generateImageMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            {generatedImages.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No images generated yet.</p>
                <p className="text-sm">Switch to the Generate tab to create your first image.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                      image.isSelected 
                        ? 'border-orange-500 shadow-lg shadow-orange-500/25' 
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full aspect-square object-cover"
                    />
                    
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleImageSelect(image.url)}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          Select
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = image.url;
                            link.download = `character-${image.id}.jpg`;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {image.isSelected && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-orange-600">Selected</Badge>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-white text-xs truncate">{image.prompt}</p>
                      <p className="text-zinc-300 text-xs">Style: {image.style}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default CharacterImageGenerator;
