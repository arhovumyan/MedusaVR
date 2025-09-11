# Character Consistency in Image Generation

## Overview

The system now supports generating custom images with any prompt while maintaining character consistency by using the same model/checkpoint that was used to create the original character.

## How It Works

### 1. Character Art Style Tracking

When characters are created, the system stores:
- `artStyle.primaryStyle`: The art style used (anime, cartoon, fantasy, realistic)
- `imageGeneration.model`: The specific model used for generation

### 2. Model Mapping

The system maps art styles to specific models:

- **Realistic**: `cyberrealistic.safetensors` (port 7860)
- **Anime/Cartoon/Fantasy**: `diving.safetensors` (port 7861)

### 3. Generate Images Page Features

#### Navigation
- Users can access the generate images page via:
  - Direct link: `/generate-images`
  - Character page "Generate Images" button: `/generate-images?characterId={id}`

#### Character Selection
- Dropdown showing all user's characters
- Automatic selection if arriving from character page
- Visual indicator showing which art style/model will be used

#### Art Style Indicator
When a character is selected, users see:
```
🟠 Using Anime Style (diving.safetensors)
Images will be generated using the same model as the original character
```

#### Custom Prompts
- **Positive Prompt**: Users can describe any scene, pose, environment, clothing, etc.
- **Negative Prompt**: Users can specify what they don't want in the image
- **High Quality Settings**: 25 steps, CFG scale 8, high-resolution enhancement

### 4. Technical Implementation

#### Frontend (GenerateImagesPage.tsx)
```typescript
// Extract character's art style for consistency
const characterArtStyle = (selectedCharacter as any).artStyle?.primaryStyle || 'anime';
const characterModel = (selectedCharacter as any).imageGeneration?.model || null;

// Pass to API for model selection
const response = await apiRequest('POST', '/api/image-generation/generate', {
  prompt,
  negativePrompt,
  characterId: selectedCharacterId,
  characterName: selectedCharacter.name,
  artStyle: characterArtStyle, // Ensures same model is used
  model: characterModel,
  steps: 25, // High quality
  cfgScale: 8
});
```

#### Backend (imageGeneration.ts)
```typescript
// Controller accepts artStyle parameter
const {
  prompt,
  artStyle, // For character consistency
  characterId,
  // ... other params
} = req.body;

// Use character's original art style for model selection
const imageResult = await runPodService.generateImage({
  prompt,
  artStyle: artStyle, // Maps to correct endpoint URL
  model: model || runPodService.getRecommendedModel(artStyle),
  // ... other settings
});
```

#### RunPod Service (RunPodService.ts)
```typescript
// Maps art styles to correct endpoints
private getWebUIUrlForStyle(style?: string): string | null {
  switch (style.toLowerCase()) {
    case 'realistic':
      return process.env.RUNPOD_REALISTIC_URL; // Port 7860
    case 'anime':
    case 'cartoon':
    case 'fantasy':
    default:
      return process.env.RUNPOD_ANIME_CARTOON_FANTASY_URL; // Port 7861
  }
}

// Maps art styles to model checkpoints
getRecommendedModel(style: string): string {
  switch (style.toLowerCase()) {
    case 'realistic':
      return 'cyberrealistic.safetensors';
    case 'anime':
    case 'cartoon':
    case 'fantasy':
    default:
      return 'diving.safetensors';
  }
}
```

## Usage Examples

### Example 1: Changing Outfit
**Character**: Anime-style character named "Sakura"
**Prompt**: "Sakura wearing a beautiful red evening dress, formal ballroom setting, elegant pose, sparkling jewelry"
**Result**: Uses `diving.safetensors` model (port 7861) to maintain anime art style

### Example 2: Different Environment
**Character**: Realistic-style character named "Alex"
**Prompt**: "Alex standing on a mountain peak at sunset, hiking gear, dramatic landscape, golden hour lighting"
**Result**: Uses `cyberrealistic.safetensors` model (port 7860) to maintain realistic art style

### Example 3: Action Scene
**Character**: Fantasy-style character named "Eldara"
**Prompt**: "Eldara casting a powerful spell, magical energy swirling around her, mystical forest background, dynamic action pose"
**Result**: Uses `diving.safetensors` model (port 7861) to maintain fantasy art style

## Benefits

1. **Character Consistency**: Generated images match the original character's art style
2. **Creative Freedom**: Users can create any scene or situation they want
3. **Quality Assurance**: Uses the same high-quality models and settings as character creation
4. **User-Friendly**: Clear visual indicators show which model will be used
5. **Flexibility**: Supports both positive and negative prompts for precise control

## API Endpoints

### POST /api/image-generation/generate
```typescript
{
  prompt: string;              // Required: What you want to see
  negativePrompt?: string;     // Optional: What you don't want
  characterId: string;         // Character for consistency
  characterName: string;       // Character name
  artStyle: string;           // Character's original art style
  model?: string;             // Specific model (optional)
  width?: number;             // Image width (default: 512)
  height?: number;            // Image height (default: 768)
  steps?: number;             // Generation steps (default: 25)
  cfgScale?: number;          // CFG scale (default: 8)
  nsfw?: boolean;             // Content rating
}
```

## Environment Variables

Ensure these are configured for proper model routing:
```
RUNPOD_REALISTIC_URL=https://e5nav08pdalr5a-7860.proxy.runpod.net/
RUNPOD_ANIME_CARTOON_FANTASY_URL=https://e5nav08pdalr5a-7861.proxy.runpod.net/
```

## Future Enhancements

1. **Batch Generation**: Generate multiple images with different prompts
2. **Prompt Templates**: Pre-built prompts for common scenarios
3. **Style Transfer**: Option to generate in different styles while maintaining character features
4. **Image History**: Save and manage generated images per character
5. **Advanced Settings**: More control over generation parameters

## Troubleshooting

### Character Art Style Not Detected
- **Issue**: Art style shows as default "anime" instead of character's actual style
- **Solution**: Character might be created with older system. Art style will default to anime/diving.safetensors

### Wrong Model Used
- **Issue**: Generated image doesn't match character's style
- **Solution**: Check that environment variables are properly set and RunPod endpoints are accessible

### Generation Fails
- **Issue**: Image generation returns error
- **Solution**: 
  1. Check RunPod service availability
  2. Verify environment variables
  3. Ensure prompts don't contain restricted content
  4. Check if user has sufficient permissions

## Technical Notes

- System maintains backward compatibility with older characters
- Falls back to anime/diving.safetensors if art style cannot be determined
- Uses 25 steps and high-resolution enhancement for maximum quality
- Supports both txt2img generation for new images
- Character data is used for prompt context and model selection only
