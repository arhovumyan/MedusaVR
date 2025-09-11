import crypto from 'crypto';
import { CharacterImageService } from './CharacterImageService.js';
import runPodService from './RunPodService.js';

export interface CharacterGenerationOptions {
  characterName: string;
  description: string;
  artStyle: string;
  selectedTags?: {
    'character-type'?: string[];
    'appearance'?: string[];
    'personality'?: string[];
    [key: string]: string[] | undefined;
  };
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  userId: string;
  username: string;
}

export interface CharacterGenerationResult {
  success: boolean;
  imageUrl?: string;
  seed?: number;
  characterSeed?: number;
  error?: string;
  generationData?: any;
}

export class CharacterGenerationService {
  
  /**
   * Generate a consistent seed for a character based on name and description
   * This ensures the same character always generates with the same base features
   */
  static generateCharacterSeed(characterName: string, description: string): number {
    const combined = `${characterName.toLowerCase()}_${description.toLowerCase()}`;
    const hash = crypto.createHash('md5').update(combined).digest('hex');
    // Convert first 8 characters of hash to a number (0 to 4294967295)
    return parseInt(hash.substring(0, 8), 16);
  }

  /**
   * Generate a variation seed based on character seed and variation type
   * This allows for consistent variations (face, body, outfit) of the same character
   */
  static generateVariationSeed(characterSeed: number, variationType: 'face' | 'body' | 'outfit' | 'default' = 'default'): number {
    const variationMap = {
      'face': 1,
      'body': 2, 
      'outfit': 3,
      'default': 0
    };
    
    const variationOffset = variationMap[variationType];
    return (characterSeed + variationOffset * 1000) % 2147483647;
  }

  /**
   * Build enhanced prompt for character generation with consistency features
   * Format: art style + character description + personality + tags + quality modifiers
   */
  static buildConsistentPrompt(options: CharacterGenerationOptions): string {
    const promptParts: string[] = [];

    // Start with quality and style modifiers
    promptParts.push('masterpiece', 'best quality', 'amazing quality', 'very aesthetic', '4k', 'detailed');

    // Add art style context first
    switch (options.artStyle.toLowerCase()) {
      case 'anime':
        promptParts.push('anime style', 'anime coloring', '1girl');
        break;
      case 'cartoon':
        promptParts.push('cartoon style', 'stylized', '1girl');
        break;
      case 'fantasy':
        promptParts.push('fantasy art', 'detailed fantasy', '1girl');
        break;
      case 'realistic':
        promptParts.push('ultra realistic', 'photorealistic', '1woman');
        break;
      default:
        promptParts.push('anime style', '1girl');
    }

    // Add character description as the main content
    if (options.description && options.description.trim()) {
      const cleanDescription = options.description.trim();
      promptParts.push(cleanDescription);
    }

    // Add personality traits from both sources
    const personalityTraits: string[] = [];
    
    // Add main personality trait if available
    if (options.selectedTags?.personality && options.selectedTags.personality.length > 0) {
      personalityTraits.push(...options.selectedTags.personality);
    }

    // Add personality expression
    if (personalityTraits.length > 0) {
      const trait = personalityTraits[0]; // Use the first/main trait
      promptParts.push(`${trait} expression`);
    }

    // Add character type tags
    if (options.selectedTags?.['character-type']) {
      options.selectedTags['character-type'].forEach(tag => {
        if (!promptParts.join(' ').toLowerCase().includes(tag.toLowerCase())) {
          promptParts.push(tag);
        }
      });
    }

    // Add appearance tags with formatting
    if (options.selectedTags?.appearance) {
      options.selectedTags.appearance.forEach(tag => {
        const formattedTag = tag.replace(/_/g, ' ').replace(/-/g, ' ');
        if (!promptParts.join(' ').toLowerCase().includes(formattedTag.toLowerCase())) {
          promptParts.push(formattedTag);
        }
      });
    }

    // Add other relevant tag categories
    ['ethnicity', 'fantasy', 'origin'].forEach(category => {
      if (options.selectedTags?.[category]) {
        options.selectedTags[category].forEach(tag => {
          const formattedTag = tag.replace(/_/g, ' ').replace(/-/g, ' ');
          if (!promptParts.join(' ').toLowerCase().includes(formattedTag.toLowerCase())) {
            promptParts.push(formattedTag);
          }
        });
      }
    });

    // Add final quality tags
    promptParts.push('detailed face', 'beautiful eyes', 'high quality');

    return promptParts.join(', ');
  }

  /**
   * Extract appearance keywords from character description
   */
  static extractAppearanceKeywords(description: string): string[] {
    const keywords: string[] = [];
    const lowercaseDesc = description.toLowerCase();

    // Hair colors and styles
    const hairFeatures = [
      'blonde hair', 'brown hair', 'black hair', 'red hair', 'pink hair', 'blue hair', 'green hair',
      'long hair', 'short hair', 'curly hair', 'straight hair', 'wavy hair', 'ponytail', 'braids'
    ];
    
    hairFeatures.forEach(feature => {
      if (lowercaseDesc.includes(feature)) {
        keywords.push(feature.replace(' ', '_'));
      }
    });

    // Eye colors
    const eyeColors = ['blue eyes', 'green eyes', 'brown eyes', 'hazel eyes', 'grey eyes', 'amber eyes'];
    eyeColors.forEach(color => {
      if (lowercaseDesc.includes(color)) {
        keywords.push(color.replace(' ', '_'));
      }
    });

    // Body types
    const bodyTypes = ['tall', 'short', 'petite', 'curvy', 'slim', 'athletic'];
    bodyTypes.forEach(type => {
      if (lowercaseDesc.includes(type)) {
        keywords.push(type);
      }
    });

    // Clothing/style
    const clothing = ['dress', 'suit', 'casual', 'formal', 'uniform', 'armor', 'robes'];
    clothing.forEach(item => {
      if (lowercaseDesc.includes(item)) {
        keywords.push(item);
      }
    });

    return keywords.slice(0, 8); // Limit to 8 keywords to avoid over-prompting
  }

  /**
   * Build negative prompt for character consistency  
   * Based on working curl commands from runningModels.md
   */
  static buildConsistentNegativePrompt(artStyle: string): string {
    // Base negative prompt from working curl commands
    const baseNegative = [
      '(worst quality, low quality, normal quality)',
      'lowres',
      'bad anatomy',
      'bad hands',
      'signature',
      'watermarks',
      'ugly',
      'imperfect eyes',
      'unnatural face',
      'unnatural body',
      'error',
      'extra limb',
      'missing limbs'
    ];

    // Add style-specific negative prompts
    switch (artStyle.toLowerCase()) {
      case 'realistic':
        // For realistic style, avoid cartoonish elements
        baseNegative.push('cartoon', 'anime', 'toon', 'caucasian');
        break;
      case 'anime':
      case 'cartoon':
      case 'fantasy':
        // For anime/cartoon/fantasy, avoid realistic photography terms
        baseNegative.push('photorealistic', '3d render', 'photograph');
        break;
    }

    return baseNegative.join(', ');
  }

  /**
   * Generate consistent character avatar with seed-based approach
   */
  static async generateConsistentAvatar(options: CharacterGenerationOptions): Promise<CharacterGenerationResult> {
    try {
      console.log('🎨 Starting consistent character generation...');
      console.log('📋 Options:', JSON.stringify(options, null, 2));
      
      // Generate character-specific seed
      const characterSeed = this.generateCharacterSeed(options.characterName, options.description);
      const generationSeed = this.generateVariationSeed(characterSeed, 'default');
      
      console.log(`🎲 Character seed: ${characterSeed}, Generation seed: ${generationSeed}`);

      // Build consistent prompts
      const prompt = this.buildConsistentPrompt(options);
      const negativePrompt = this.buildConsistentNegativePrompt(options.artStyle);

      console.log(`📝 Generated prompt: ${prompt}`);
      console.log(`🚫 Negative prompt: ${negativePrompt}`);
      console.log(`🎨 Art style for URL selection: ${options.artStyle}`);

      // Generate image with RunPod using optimal quality settings
      console.log('🚀 Calling RunPod service...');
      const imageResult = await runPodService.generateImage({
        prompt,
        negativePrompt,
        width: options.width || 512,
        height: options.height || 768,
        steps: options.steps || 25, // High quality steps
        cfgScale: options.cfgScale || 8,
        seed: generationSeed,
        sampler: 'Euler a',
        enableHr: true, // Enable high-res fix
        hrUpscaler: 'Latent',
        denoisingStrength: 0.4,
        artStyle: options.artStyle,
        characterData: {
          characterName: options.characterName,
          characterPersona: options.description
        }
      });

      console.log('📊 RunPod result:', JSON.stringify(imageResult, null, 2));

      if (!imageResult.success) {
        console.error('❌ Image generation failed:', imageResult.error);
        return {
          success: false,
          error: imageResult.error || 'Failed to generate character image'
        };
      }

      console.log('✅ Consistent character generation successful!');
      
      return {
        success: true,
        imageUrl: imageResult.imageUrl,
        seed: generationSeed,
        characterSeed: characterSeed,
        generationData: {
          prompt,
          negativePrompt,
          seed: generationSeed,
          characterSeed,
          steps: options.steps || 20,
          cfgScale: options.cfgScale || 8,
          width: options.width || 512,
          height: options.height || 768,
          model: this.getModelForArtStyle(options.artStyle),
          artStyle: options.artStyle,
          generationTime: new Date(),
          runpodJobId: imageResult.imageId || null
        }
      };

    } catch (error) {
      console.error('❌ Character generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during character generation'
      };
    }
  }

  /**
   * Get the appropriate model for a given art style
   */
  static getModelForArtStyle(artStyle: string): string {
    switch (artStyle.toLowerCase()) {
      case 'realistic':
        return 'cyberrealistic.safetensors';
      case 'anime':
      case 'cartoon':
      case 'fantasy':
      default:
        return 'diving.safetensors';
    }
  }

  /**
   * Generate character variation (same character, different pose/outfit/angle)
   */
  static async generateCharacterVariation(
    characterSeed: number, 
    variationType: 'face' | 'body' | 'outfit',
    options: CharacterGenerationOptions
  ): Promise<CharacterGenerationResult> {
    
    const variationSeed = this.generateVariationSeed(characterSeed, variationType);
    
    console.log(`🎭 Generating ${variationType} variation with seed: ${variationSeed}`);

    // Modify prompt for variation type
    let basePrompt = this.buildConsistentPrompt(options);
    
    switch (variationType) {
      case 'face':
        basePrompt += ', close-up portrait, detailed facial features, same face';
        break;
      case 'body':
        basePrompt += ', full body shot, same character, different pose';
        break;
      case 'outfit':
        basePrompt += ', same character, different outfit, same face and body';
        break;
    }

    const imageResult = await runPodService.generateImage({
      prompt: basePrompt,
      negativePrompt: this.buildConsistentNegativePrompt(options.artStyle),
      width: options.width || 512,
      height: options.height || 768,
      steps: options.steps || 20,
      cfgScale: options.cfgScale || 8,
      seed: variationSeed,
      artStyle: options.artStyle,
      characterData: {
        characterName: options.characterName,
        characterPersona: options.description
      }
    });

    if (!imageResult.success) {
      return {
        success: false,
        error: imageResult.error || 'Failed to generate character variation'
      };
    }

    return {
      success: true,
      imageUrl: imageResult.imageUrl,
      seed: variationSeed,
      characterSeed: characterSeed,
      generationData: {
        prompt: basePrompt,
        seed: variationSeed,
        characterSeed,
        variationType,
        artStyle: options.artStyle,
        generationTime: new Date()
      }
    };
  }
}

export default CharacterGenerationService;