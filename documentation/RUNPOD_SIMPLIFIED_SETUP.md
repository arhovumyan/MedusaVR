# RunPod Simplified Art Style Configuration

This document outlines the simplified art style configuration for character generation.

## Changes Made

1. **Removed secondary art styles** - Simplified from 2-layer to 1-layer art style selection
2. **Consolidated checkpoints** - Reduced from 4 URLs to 2 URLs for better management
3. **Added seed-based consistency** - Characters now generate with consistent face/body/style

## Environment Variables Required

Add the following to your `.env` file:

```bash
# RunPod Art Style Configuration (Simplified) - CORRECTED MAPPING
# Anime, Cartoon, Fantasy checkpoint (7861)
RUNPOD_ANIME_CARTOON_FANTASY_URL=https://423xliueu5koxj-7861.proxy.runpod.net/

# Realistic checkpoint (7860)
RUNPOD_REALISTIC_URL=https://423xliueu5koxj-7860.proxy.runpod.net/

# Fallback URL (for backwards compatibility)
RUNPOD_WEBUI_URL=https://o8kler3vh97fyl-7860.proxy.runpod.net
```

## Art Style Routing

- **Anime** → `RUNPOD_ANIME_CARTOON_FANTASY_URL` (https://423xliueu5koxj-7861.proxy.runpod.net/)
- **Cartoon** → `RUNPOD_ANIME_CARTOON_FANTASY_URL` (https://423xliueu5koxj-7861.proxy.runpod.net/) 
- **Fantasy** → `RUNPOD_ANIME_CARTOON_FANTASY_URL` (https://423xliueu5koxj-7861.proxy.runpod.net/)
- **Realistic** → `RUNPOD_REALISTIC_URL` (https://423xliueu5koxj-7860.proxy.runpod.net/)

## Database Changes

The following fields were removed from the character model:
- `artStyle.secondaryStyle` - No longer needed with simplified selection

## UI Changes

- Removed second layer of art style selection in `CreateCharacterEnhanced.tsx`
- Simplified art style picker to single selection
- Updated character creation data structure

## Character Consistency

Characters now use seed-based generation for consistency:
- **Character-specific seeds** generated from name + description
- **Consistent face generation** across multiple images
- **Reproducible body/style** for character variations

## Testing

To test the new configuration:

1. Update your environment variables
2. Create a character with different art styles
3. Verify the correct checkpoint URL is used in logs
4. Generate multiple images to test seed consistency

## Deployment Notes

### Railway
Update environment variables in Railway dashboard

### Vercel  
Update environment variables in Vercel dashboard

### Docker
Update `.env` file or pass environment variables to container

## Backwards Compatibility

The system maintains backwards compatibility:
- Characters with `secondaryStyle` will ignore the field
- Fallback URL used if style-specific URLs not configured
- Existing characters continue to work normally 

## Troubleshooting Image Generation

If characters are using default images instead of generated ones, follow these debugging steps:

### 1. Check Environment Variables

Verify the URLs are correctly set in your `.env` file:

```bash
# Should be set to your actual RunPod URLs
RUNPOD_ANIME_CARTOON_FANTASY_URL=https://423xliueu5koxj-7861.proxy.runpod.net/
RUNPOD_REALISTIC_URL=https://423xliueu5koxj-7860.proxy.runpod.net/
```

### 2. Test RunPod Health

Use the test endpoint to verify RunPod connectivity:

```bash
# Test anime art style (should use 7861 endpoint)
GET /api/test/runpod-health/anime

# Test realistic art style (should use 7860 endpoint)  
GET /api/test/runpod-health/realistic
```

### 3. Test Image Generation

Test the complete generation pipeline:

```bash
# Test with anime art style
POST /api/test/image-generation
{
  "artStyle": "anime"
}

# Test with realistic art style
POST /api/test/image-generation
{
  "artStyle": "realistic"
}
```

### 4. Check Server Logs

Look for these log messages during character creation:

```
🎨 Starting consistent character generation...
📋 Options: {...}
🔍 Getting WebUI URL for style: "anime"
🔧 Environment variables: {...}
🎨 Using anime/cartoon/fantasy checkpoint: https://...
📝 Generated prompt: anime, female, ...
🚀 Calling RunPod service...
📊 RunPod result: {...}
✅ Consistent character generation successful!
```

### 5. Common Issues

**Issue**: Environment variables show "NOT SET"
- **Solution**: Add the URLs to your `.env` file and restart the server

**Issue**: RunPod returns 524 timeout errors  
- **Solution**: The model is loading, wait 1-11 minutes and try again

**Issue**: Default images are used despite successful setup
- **Solution**: Check that `characterData.artStyle.primaryStyle` is being passed correctly

### 6. Verify Prompt Building

The system should automatically build prompts using:
- ✅ Character description
- ✅ Selected tags (character-type, appearance, personality)
- ✅ Art style selection
- ✅ Quality and consistency tags

Example generated prompt:
```
anime, female, blonde_hair, blue_eyes, long_hair, confident expression, masterpiece, best quality, highly detailed, consistent character, same person, character sheet style
``` 