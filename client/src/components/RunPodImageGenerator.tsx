import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image as ImageIcon, Settings, Sparkles } from 'lucide-react';

interface LoraOption {
  name: string;
  description: string;
  defaultStrength: number;
}

interface ModelData {
  models: Array<{ id: string; name: string; description: string }>;
  availableStyles: Array<{ id: string; name: string; description: string; model?: string }>;
  availableDimensions: Array<{ width: number; height: number; name: string }>;
  availableSamplers: Array<{ id: string; name: string; description: string }>;
  availableLoras: LoraOption[];
  advancedSettings: {
    steps: { min: number; max: number; default: number; description: string };
    cfgScale: { min: number; max: number; default: number; description: string };
    denoisingStrength: { min: number; max: number; default: number; step: number; description: string };
    hrScale: { min: number; max: number; default: number; step: number; description: string };
  };
  serviceStatus: {
    runPodAvailable: boolean;
    status: string;
  };
}

interface GeneratedImage {
  imageId: string;
  imageUrl: string;
  prompt: string;
  seed: number;
  status: string;
}

interface SelectedLora {
  name: string;
  strength: number;
}

export const RunPodImageGenerator: React.FC = () => {
  const [modelData, setModelData] = useState<ModelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  
  // Form state
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('anime');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedSampler, setSelectedSampler] = useState('');
  const [dimensions, setDimensions] = useState({ width: 512, height: 768 });
  const [selectedLoras, setSelectedLoras] = useState<SelectedLora[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced settings
  const [steps, setSteps] = useState(20);
  const [cfgScale, setCfgScale] = useState(8);
  const [seed, setSeed] = useState(-1);
  const [enableHr, setEnableHr] = useState(true);
  const [hrScale, setHrScale] = useState(2);
  const [denoisingStrength, setDenoisingStrength] = useState(0.4);

  // Load available models and settings
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/image-generation/models');
      const data = await response.json();
      
      if (data.success) {
        setModelData(data.data);
        setSelectedModel(data.data.defaultModel);
        setSelectedSampler(data.data.availableSamplers[0]?.id || 'Euler a');
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoraToggle = (lora: LoraOption, checked: boolean) => {
    if (checked) {
      setSelectedLoras([...selectedLoras, { name: lora.name, strength: lora.defaultStrength }]);
    } else {
      setSelectedLoras(selectedLoras.filter(l => l.name !== lora.name));
    }
  };

  const handleLoraStrengthChange = (loraName: string, strength: number) => {
    setSelectedLoras(selectedLoras.map(l => 
      l.name === loraName ? { ...l, strength } : l
    ));
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    try {
      setGenerating(true);
      
      const response = await fetch('/api/image-generation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Adjust based on your auth
        },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          style: selectedStyle,
          model: selectedModel,
          sampler: selectedSampler,
          width: dimensions.width,
          height: dimensions.height,
          steps,
          cfgScale,
          seed: seed === -1 ? undefined : seed,
          loras: selectedLoras,
          enableHr,
          hrScale,
          denoisingStrength
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedImages([data.data, ...generatedImages]);
        // Reset seed for next generation
        setSeed(-1);
      } else {
        // Handle content moderation violations
        if (data.code === 'IMAGE_CONTENT_VIOLATION') {
          alert(`Content Policy Violation: ${data.message}`);
        } else if (data.banned) {
          alert(`Account Banned: ${data.message}`);
        } else {
          alert(`Generation failed: ${data.error}`);
        }
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      
      // Handle HTTP error responses
      if (error?.status === 400 || error?.status === 403) {
        alert('Content policy violation. Please review your prompt and try again.');
      } else {
        alert('Failed to generate image');
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading image generation settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Service Status */}
      {modelData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              RunPod Image Generation
              <Badge variant={modelData.serviceStatus.runPodAvailable ? 'default' : 'secondary'}>
                {modelData.serviceStatus.status}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Generation Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt & Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="masterpiece, best quality, anime coloring, anime screenshot, 1girl, space ship, indoors, Yuki Mori..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="negativePrompt">Negative Prompt</Label>
                <Textarea
                  id="negativePrompt"
                  placeholder="blurry, bad anatomy, extra limbs, low quality..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                />
              </div>

              {modelData && (
                <div>
                  <Label>Style</Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelData.availableStyles.map(style => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name} - {style.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {modelData && (
                <div>
                  <Label>Dimensions</Label>
                  <Select 
                    value={`${dimensions.width}x${dimensions.height}`}
                    onValueChange={(value) => {
                      const [width, height] = value.split('x').map(Number);
                      setDimensions({ width, height });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelData.availableDimensions.map(dim => (
                        <SelectItem key={`${dim.width}x${dim.height}`} value={`${dim.width}x${dim.height}`}>
                          {dim.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* LORAs */}
          {modelData && modelData.availableLoras.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>LORAs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {modelData.availableLoras.map(lora => {
                  const isSelected = selectedLoras.some(l => l.name === lora.name);
                  const selectedLora = selectedLoras.find(l => l.name === lora.name);
                  
                  return (
                    <div key={lora.name} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={lora.name}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleLoraToggle(lora, checked as boolean)}
                        />
                        <Label htmlFor={lora.name} className="text-sm font-medium">
                          {lora.name}
                        </Label>
                        <span className="text-xs text-gray-500">{lora.description}</span>
                      </div>
                      {isSelected && (
                        <div className="ml-6">
                          <Label className="text-xs">Strength: {selectedLora?.strength}</Label>
                          <Slider
                            value={[selectedLora?.strength || lora.defaultStrength]}
                            onValueChange={([value]) => handleLoraStrengthChange(lora.name, value)}
                            min={0}
                            max={1}
                            step={0.1}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="h-4 w-4" />
                Advanced Settings
                <Badge variant="outline">{showAdvanced ? 'Hide' : 'Show'}</Badge>
              </CardTitle>
            </CardHeader>
            {showAdvanced && modelData && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modelData.models.map(model => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Sampler</Label>
                    <Select value={selectedSampler} onValueChange={setSelectedSampler}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modelData.availableSamplers.map(sampler => (
                          <SelectItem key={sampler.id} value={sampler.id}>
                            {sampler.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Steps: {steps}</Label>
                  <Slider
                    value={[steps]}
                    onValueChange={([value]) => setSteps(value)}
                    min={modelData.advancedSettings.steps.min}
                    max={modelData.advancedSettings.steps.max}
                    step={1}
                  />
                </div>

                <div>
                  <Label>CFG Scale: {cfgScale}</Label>
                  <Slider
                    value={[cfgScale]}
                    onValueChange={([value]) => setCfgScale(value)}
                    min={modelData.advancedSettings.cfgScale.min}
                    max={modelData.advancedSettings.cfgScale.max}
                    step={0.5}
                  />
                </div>

                <div>
                  <Label htmlFor="seed">Seed (-1 for random)</Label>
                  <Input
                    id="seed"
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(Number(e.target.value))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableHr"
                    checked={enableHr}
                    onCheckedChange={(checked) => setEnableHr(checked === true)}
                  />
                  <Label htmlFor="enableHr">Enable High Resolution</Label>
                </div>

                {enableHr && (
                  <>
                    <div>
                      <Label>HR Scale: {hrScale}</Label>
                      <Slider
                        value={[hrScale]}
                        onValueChange={([value]) => setHrScale(value)}
                        min={modelData.advancedSettings.hrScale.min}
                        max={modelData.advancedSettings.hrScale.max}
                        step={modelData.advancedSettings.hrScale.step}
                      />
                    </div>

                    <div>
                      <Label>Denoising Strength: {denoisingStrength}</Label>
                      <Slider
                        value={[denoisingStrength]}
                        onValueChange={([value]) => setDenoisingStrength(value)}
                        min={modelData.advancedSettings.denoisingStrength.min}
                        max={modelData.advancedSettings.denoisingStrength.max}
                        step={modelData.advancedSettings.denoisingStrength.step}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            )}
          </Card>

          <Button 
            onClick={generateImage} 
            disabled={generating || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </div>

        {/* Generated Images */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Images</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedImages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No images generated yet</p>
                  <p className="text-sm">Enter a prompt and click generate to create your first image</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedImages.map((image) => (
                    <div key={image.imageId} className="border rounded-lg p-4">
                      <img 
                        src={image.imageUrl} 
                        alt={image.prompt}
                        className="w-full rounded-lg mb-3"
                      />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Prompt:</p>
                        <p className="text-xs text-gray-600 break-words">{image.prompt}</p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Seed: {image.seed}</span>
                          <Badge variant="outline">{image.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
