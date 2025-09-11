# Character Image Regeneration Guide

## Overview
The character creation system now supports high-quality image generation with the ability to regenerate images for existing characters while maintaining character consistency using img2img technology.

## High-Quality Settings Applied

### Image Generation Parameters
- **Steps**: 25 (increased from 20 for higher quality)
- **CFG Scale**: 8
- **Sampler**: Euler a
- **Enable HR**: true (High-resolution fix enabled)
- **HR Upscaler**: Latent
- **Denoising Strength**: 0.4 (for txt2img), 0.2 (for img2img consistency)
- **Dimensions**: 512x768 (portrait orientation)

### Cloudinary Upload Quality
- **Quality**: auto:best (maximum quality)
- **Format**: webp (modern format with better compression)
- **Transformation**: quality: 100
- **Flags**: progressive (for better loading)

## How Character Creation Works

1. **User Input Processing**: The system combines:
   - Art style (anime/cartoon/fantasy → port 7861, realistic → port 7860)
   - Character description
   - Personality traits
   - Appearance tags
   - Other selected tags

2. **Prompt Building**: Creates a comprehensive prompt:
   ```
   masterpiece, best quality, amazing quality, very aesthetic, 4k, detailed, 
   [art style], [character description], [personality expression], 
   [character-type tags], [appearance tags], [other tags],
   detailed face, beautiful eyes, high quality
   ```

3. **Image Generation**: Uses RunPod with the appropriate model:
   - **Realistic**: cyberrealistic.safetensors
   - **Anime/Cartoon/Fantasy**: diving.safetensors

4. **Cloudinary Upload**: Saves the generated image at maximum quality

5. **Database Storage**: Saves character with all metadata including generation parameters

## How to Regenerate Character Images

### API Endpoint
```
POST /api/characters/:id/regenerate-image
```

### Headers
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### Request Body
```json
{
  "newPrompt": "same character but in a different outfit, wearing a red dress, standing in a garden",
  "denoisingStrength": 0.2
}
```

### Parameters
- **newPrompt** (required): New description for the character variation
- **denoisingStrength** (optional): 0.1-0.9 (lower = more similar to original, higher = more variation)
  - 0.1-0.2: Very similar to original (clothing, pose changes)
  - 0.3-0.5: Moderate changes (background, lighting, minor appearance changes)
  - 0.6-0.9: Major changes (significant pose, style variations)

### Example Usage

#### JavaScript/Frontend
```javascript
async function regenerateCharacterImage(characterId, newPrompt, denoisingStrength = 0.2) {
  try {
    const token = localStorage.getItem("medusavr_access_token");
    
    const response = await fetch(`/api/characters/${characterId}/regenerate-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPrompt,
        denoisingStrength
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('New image generated:', result.character.avatar);
      console.log('Previous image saved as:', result.character.previousImage);
    } else {
      console.error('Regeneration failed:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('Error regenerating image:', error);
  }
}

// Example usage
regenerateCharacterImage(
  12345, 
  "same character but wearing armor, standing in a castle, epic lighting", 
  0.2
);
```

#### cURL Example
```bash
curl -X POST https://your-domain.com/api/characters/12345/regenerate-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newPrompt": "same character but in casual clothes, sitting in a cafe, warm lighting",
    "denoisingStrength": 0.2
  }'
```

### Response Format
```json
{
  "success": true,
  "message": "Character image regenerated successfully!",
  "character": {
    "id": 12345,
    "name": "Character Name",
    "avatar": "https://res.cloudinary.com/.../new_image.webp",
    "previousImage": "https://res.cloudinary.com/.../original_image.webp"
  },
  "generationData": {
    "originalImageUrl": "https://res.cloudinary.com/.../original_image.webp",
    "newPrompt": "same character but in casual clothes...",
    "denoisingStrength": 0.2,
    "artStyle": "anime",
    "cloudinaryPublicId": "username/characters/character_name_1234567890",
    "generationTime": "2025-07-18T...",
    "method": "img2img_consistency"
  }
}
```

## Benefits of This System

1. **Character Consistency**: Using img2img ensures the same character face and basic features
2. **Flexibility**: Can generate variations with different:
   - Outfits and clothing
   - Poses and expressions
   - Backgrounds and settings
   - Lighting and mood
   - Minor appearance changes

3. **Quality**: High-resolution generation with optimal settings
4. **Preservation**: Previous images are saved as alternative versions
5. **User Control**: Denoising strength allows fine-tuning similarity vs variation

## Best Practices

### For Character Creation
- Use detailed descriptions including personality traits
- Select appropriate art style for your character concept
- Include specific appearance tags for better consistency

### For Regeneration
- Start with low denoising strength (0.1-0.2) for outfit/pose changes
- Use specific prompts: "same character but [specific change]"
- For major style changes, gradually increase denoising strength
- Test different prompts to find the best variations

### Prompt Examples for Regeneration
```
// Outfit changes (low denoising: 0.1-0.2)
"same character but wearing a school uniform, standing in classroom"
"same character but in swimwear, at the beach, sunny day"
"same character but in winter coat, snowy background"

// Pose/expression changes (medium denoising: 0.2-0.3)
"same character but smiling happily, jumping with joy"
"same character but sitting cross-legged, reading a book"
"same character but looking confident, hands on hips"

// Setting/mood changes (medium denoising: 0.3-0.4)
"same character but in cyberpunk city, neon lighting, night scene"
"same character but in magical forest, ethereal lighting"
"same character but in cozy bedroom, soft morning light"
```

## Technical Implementation

The regeneration system:
1. Downloads the original character image from Cloudinary
2. Converts it to base64 for img2img processing
3. Uses the character's original art style and model
4. Applies the new prompt with optimal generation settings
5. Uploads the new image at maximum quality
6. Updates the character record with the new image
7. Preserves the original image as an alternative version

This ensures both quality and consistency while providing flexibility for character variations.
