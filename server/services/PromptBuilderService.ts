export interface CharacterCreationData {
  name: string;
  description: string;
  quickSuggestion?: string;
  personalityTraits?: {
    mainTrait?: string;
    subTraits: string[];
  };
  artStyle?: {
    primaryStyle?: string;
    secondaryStyle?: string;
  };
  selectedTags?: {
    'character-type': string[];
    'genre': string[];
    'personality': string[];
    'appearance': string[];
    'origin': string[];
    'sexuality': string[];
    'fantasy': string[];
    'content-rating': string[];
    'ethnicity': string[];
    'scenario': string[];
  };
}

export interface ModelConfig {
  model: string;
  loras?: Array<{
    name: string;
    strength: number;
  }>;
}

export class PromptBuilderService {
  
  /**
   * Map art styles to specific models as requested by user
   */
  static getModelForArtStyle(artStyle: string): ModelConfig {
    const modelMapping: { [key: string]: ModelConfig } = {
      'anime': {
        model: 'diving.safetensors'
      },
      'cartoon': {
        model: 'ILustMix.safetensors'
      },
      'furry': {
        model: 'novaFurry.safetensors'
      },
      'realistic': {
        model: 'cyberrealistic.safetensors'
      }
    };

    return modelMapping[artStyle] || modelMapping['anime']; // Default to anime
  }

  /**
   * Build comprehensive prompt from character creation data
   */
  static buildPrompt(characterData: CharacterCreationData): {
    prompt: string;
    negativePrompt: string;
    modelConfig: ModelConfig;
    styleKeywords: string[];
  } {
    const promptParts: string[] = [];
    const styleKeywords: string[] = [];
    
    // Start with quality tags for better results
    promptParts.push('masterpiece, best quality, highly detailed');
    
    // Add art style specific keywords (both primary and secondary)
    const primaryStyle = characterData.artStyle?.primaryStyle;
    const secondaryStyle = characterData.artStyle?.secondaryStyle;
    
    if (primaryStyle) {
      switch (primaryStyle) {
        case 'anime':
          promptParts.push('anime style, anime coloring, anime screenshot');
          styleKeywords.push('anime', 'detailed anime art');
          break;
        case 'cartoon':
          promptParts.push('cartoon style, vibrant colors, stylized art');
          styleKeywords.push('cartoon', 'stylized illustration');
          break;
        case 'furry':
          promptParts.push('furry art, anthropomorphic, detailed fur texture');
          styleKeywords.push('furry', 'anthropomorphic character');
          break;
        case 'realistic':
          promptParts.push('photorealistic, realistic lighting, detailed skin texture');
          styleKeywords.push('realistic', 'photographic quality');
          break;
      }
    }

    // Add secondary art style if different from primary
    if (secondaryStyle && secondaryStyle !== primaryStyle) {
      switch (secondaryStyle) {
        case 'modern-anime':
          promptParts.push('modern anime style, clean lineart');
          break;
        case 'classic-anime':
          promptParts.push('classic anime style, retro anime');
          break;
        case 'chibi':
          promptParts.push('chibi style, cute proportions');
          break;
        case 'semi-realistic':
          promptParts.push('semi-realistic, detailed shading');
          break;
        case 'modern-cartoon':
          promptParts.push('modern cartoon style, clean vector art');
          break;
        case 'classic-cartoon':
          promptParts.push('classic cartoon style, traditional animation');
          break;
        case 'disney-style':
          promptParts.push('Disney style, expressive features');
          break;
        case 'pixar-style':
          promptParts.push('Pixar style, 3D rendered look');
          break;
        default:
          if (secondaryStyle) {
            promptParts.push(secondaryStyle.replace('-', ' ') + ' style');
          }
          break;
      }
    }

    // Add character type from tags
    const characterType = characterData.selectedTags?.['character-type'] || [];
    if (characterType.includes('female')) {
      promptParts.push('1girl');
    } else if (characterType.includes('male')) {
      promptParts.push('1boy');
    }

    // Add the full user description (this is the main content they want included!)
    if (characterData.description && characterData.description.trim()) {
      // Clean and add the description, removing any potential problematic characters
      const cleanDescription = characterData.description
        .trim()
        .replace(/[{}[\]]/g, '') // Remove brackets that could interfere with prompt syntax
        .replace(/\s+/g, ' '); // Normalize whitespace
      promptParts.push(cleanDescription);
    }

    // Add ALL personality traits (main trait + sub traits)
    const personalityTraits = [
      characterData.personalityTraits?.mainTrait,
      ...(characterData.personalityTraits?.subTraits || [])
    ].filter(Boolean);

    if (personalityTraits.length > 0) {
      // Add personality traits directly as descriptors
      promptParts.push(...personalityTraits.map(trait => trait.replace('-', ' ')));
      
      // Also add visual personality mappings
      const personalityVisuals = this.mapPersonalityToVisuals(personalityTraits as string[]);
      if (personalityVisuals.length > 0) {
        promptParts.push(...personalityVisuals);
      }
    }

    // Add ALL tags from all categories
    const allTagCategories = characterData.selectedTags || {};
    Object.entries(allTagCategories).forEach(([category, tags]) => {
      if (Array.isArray(tags) && tags.length > 0) {
        // Skip content-rating as it's not visual
        if (category !== 'content-rating') {
          const cleanTags = tags.map(tag => tag.replace('-', ' ')).filter(tag => 
            // Filter out non-visual tags
            !['nsfw', 'sfw', 'safe'].includes(tag.toLowerCase())
          );
          if (cleanTags.length > 0) {
            promptParts.push(...cleanTags);
          }
        }
      }
    });

    // Add pose and composition
    promptParts.push('portrait, looking at viewer, detailed face, high quality');

    // Build negative prompt
    const negativePrompt = this.buildNegativePrompt(primaryStyle);

    // Get model configuration
    const modelConfig = this.getModelForArtStyle(primaryStyle || 'anime');

    return {
      prompt: promptParts.join(', '),
      negativePrompt,
      modelConfig,
      styleKeywords
    };
  }

  /**
   * Map personality traits to visual descriptors
   */
  private static mapPersonalityToVisuals(traits: string[]): string[] {
    const visualMapping: { [key: string]: string[] } = {
      // Calm cluster
      'calm': ['serene expression', 'peaceful look'],
      'peaceful': ['gentle smile', 'soft expression'],
      'serene': ['tranquil pose', 'composed demeanor'],
      'collected': ['confident posture', 'steady gaze'],
      
      // Energetic cluster  
      'energetic': ['bright expression', 'dynamic pose'],
      'enthusiastic': ['joyful smile', 'excited expression'],
      'vibrant': ['lively pose', 'animated gesture'],
      'spirited': ['confident stance', 'bold expression'],
      
      // Mysterious cluster
      'mysterious': ['enigmatic smile', 'mysterious aura'],
      'secretive': ['knowing look', 'hidden expression'],
      'enigmatic': ['cryptic gaze', 'mysterious atmosphere'],
      'shadowy': ['dramatic lighting', 'shadowed features'],
      
      // Confident cluster
      'confident': ['strong pose', 'confident gaze'],
      'bold': ['assertive stance', 'direct look'],
      'assertive': ['commanding presence', 'determined expression'],
      'dominant': ['powerful pose', 'intense stare'],
      
      // Flirty cluster
      'flirty': ['playful smile', 'coy expression'],
      'seductive': ['alluring pose', 'sultry gaze'],
      'charming': ['captivating smile', 'charming look'],
      'playful': ['mischievous grin', 'teasing expression']
    };

    const visuals: string[] = [];
    traits.forEach(trait => {
      if (visualMapping[trait]) {
        visuals.push(...visualMapping[trait]);
      }
    });

    return visuals;
  }

  /**
   * Extract visual keywords from character description
   */
  private static extractVisualKeywords(description: string): string[] {
    const keywords: string[] = [];
    const lowercaseDesc = description.toLowerCase();

    // Hair colors
    const hairColors = ['blonde', 'brunette', 'redhead', 'black hair', 'white hair', 'silver hair', 'pink hair', 'blue hair', 'green hair'];
    hairColors.forEach(color => {
      if (lowercaseDesc.includes(color)) {
        keywords.push(color.replace(' hair', '_hair'));
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

    // Clothing styles
    const clothing = ['dress', 'suit', 'casual', 'formal', 'uniform', 'armor', 'robes'];
    clothing.forEach(item => {
      if (lowercaseDesc.includes(item)) {
        keywords.push(item);
      }
    });

    return keywords.slice(0, 8); // Limit to avoid prompt overload
  }

  /**
   * Build negative prompt based on art style
   */
  private static buildNegativePrompt(artStyle?: string): string {
    const baseNegative = [
      'worst quality', 'low quality', 'normal quality', 'lowres',
      'bad anatomy', 'bad hands', 'bad proportions',
      'blurry', 'out of focus', 'jpeg artifacts',
      'watermark', 'signature', 'text', 'error',
      'extra limbs', 'missing limbs', 'extra fingers', 'missing fingers',
      'deformed', 'disfigured', 'mutated'
    ];

    // Add style-specific negative prompts
    switch (artStyle) {
      case 'realistic':
        baseNegative.push('cartoon', 'anime', 'painting', 'sketch', 'drawing');
        break;
      case 'anime':
        baseNegative.push('realistic', 'photographic', '3d render');
        break;
      case 'cartoon':
        baseNegative.push('realistic', 'photographic', 'dark', 'gritty');
        break;
      case 'furry':
        baseNegative.push('human only', 'no fur', 'realistic human');
        break;
    }

    return baseNegative.join(', ');
  }

  /**
   * Generate a character-specific seed for consistency
   */
  static generateCharacterSeed(characterName: string, description: string): number {
    // Create a deterministic seed based on character data
    const combined = `${characterName}_${description}`.toLowerCase();
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 2147483647; // Ensure positive seed
  }

  /**
   * Build prompt for future images of the same character (for consistency)
   */
  static buildConsistentPrompt(
    originalPrompt: string, 
    originalSeed: number, 
    newContext: string = ''
  ): {
    prompt: string;
    seed: number;
  } {
    // Extract character features from original prompt
    const characterFeatures = this.extractCharacterFeatures(originalPrompt);
    
    // Build new prompt with consistent character features + new context
    const promptParts = [
      'masterpiece, best quality, highly detailed',
      ...characterFeatures,
      newContext,
      'detailed face, high quality'
    ].filter(Boolean);

    return {
      prompt: promptParts.join(', '),
      seed: originalSeed // Use same seed for consistency
    };
  }

  /**
   * Extract character-specific features from a prompt
   */
  private static extractCharacterFeatures(prompt: string): string[] {
    const features: string[] = [];
    const parts = prompt.split(', ');
    
    // Features that define character identity
    const characterIdentifiers = [
      /\d+girl|\d+boy/, // gender
      /\w+_hair/, // hair color
      /\w+_eyes/, // eye color
      /anime|realistic|cartoon|furry/, // style
      /asian|caucasian|african|latina/, // ethnicity
      /tall|short|petite|curvy|slim|athletic/, // body type
    ];

    parts.forEach(part => {
      characterIdentifiers.forEach(pattern => {
        if (pattern.test(part)) {
          features.push(part);
        }
      });
    });

    return features;
  }
} 