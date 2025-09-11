# RunPod Art Style-Specific Checkpoint Setup

This guide explains how to configure multiple RunPod checkpoints for different art styles in your MedusaVR application.

## Overview

The system now supports art style-specific checkpoints that automatically select the appropriate RunPod URL based on the art style chosen during character creation.

## Environment Variables Required

Add these environment variables to your `server/.env` file:

```bash
# RunPod Configuration - Art Style Specific URLs
RUNPOD_CARTOON_URL=https://qwdsnma5axuu45-7860.proxy.runpod.net/
RUNPOD_REALISTIC_URL=https://qwdsnma5axuu45-7861.proxy.runpod.net/
RUNPOD_ANIME_URL=https://qwdsnma5axuu45-7862.proxy.runpod.net/
RUNPOD_FANTASY_URL=https://qwdsnma5axuu45-7863.proxy.runpod.net/

# Fallback URL (keeping for backward compatibility)
RUNPOD_WEBUI_URL=https://o8kler3vh97fyl-7860.proxy.runpod.net
```

## Art Style Mapping

The system automatically maps art styles to their corresponding checkpoints:

- **Cartoon** → `RUNPOD_CARTOON_URL` (port 7860)
- **Realistic** → `RUNPOD_REALISTIC_URL` (port 7861) 
- **Anime** → `RUNPOD_ANIME_URL` (port 7862)
- **Fantasy** → `RUNPOD_FANTASY_URL` (port 7863)

If no art style is provided or the URL is not configured, the system falls back to `RUNPOD_WEBUI_URL`.

## How It Works

1. **Character Creation**: When a user selects an art style during character creation, it's stored in the character's `artStyle.primaryStyle` field.

2. **Image Generation**: When generating images, the system:
   - Reads the art style from the request
   - Maps it to the appropriate RunPod URL
   - Sends the generation request to the correct checkpoint

3. **Logging**: The system logs which checkpoint is being used:
   ```
   🎨 Using anime checkpoint: https://qwdsnma5axuu45-7862.proxy.runpod.net/
   ```

## Testing the Setup

### 1. Environment Variables

Make sure your RunPod instances are running on the specified ports and accessible via the provided URLs.

### 2. Test with Different Art Styles

You can test the system by creating characters with different art styles:

```bash
# Test anime checkpoint
curl -X POST https://your-api-url/api/image-generation/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "prompt": "masterpiece, best quality, 1girl, anime style",
    "style": "anime",
    "width": 512,
    "height": 768
  }'

# Test realistic checkpoint  
curl -X POST https://your-api-url/api/image-generation/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "prompt": "masterpiece, best quality, 1girl, photorealistic",
    "style": "realistic", 
    "width": 512,
    "height": 768
  }'
```

### 3. Check Logs

Monitor your server logs to see which checkpoints are being used:

```bash
# Example log output
🎨 Using anime checkpoint: https://qwdsnma5axuu45-7862.proxy.runpod.net/
🎨 Sending request to RunPod: {
  url: 'https://qwdsnma5axuu45-7862.proxy.runpod.net/sdapi/v1/txt2img',
  prompt: 'masterpiece, best quality, 1girl, anime style...',
  model: 'ILustMix.safetensors',
  dimensions: '512x768'
}
```

## Troubleshooting

### Missing Environment Variables

If an art style-specific URL is not configured, you'll see this error:
```
RunPod WebUI URL not configured. Please set the appropriate environment variables for your art style.
```

**Solution**: Add the missing environment variable to your `.env` file.

### Fallback Behavior

If a specific art style URL is not available, the system will fall back to `RUNPOD_WEBUI_URL`:
```
🎨 Using fallback checkpoint: https://o8kler3vh97fyl-7860.proxy.runpod.net
```

### Health Checks

The existing health check endpoints will still work, but they only test the fallback URL. Each art style URL should be tested individually.

## Code Changes Made

### 1. RunPodService.ts
- Added `getWebUIUrlForStyle()` method to map art styles to URLs
- Updated `generateImage()` to use art style-specific URLs
- Added `artStyle` parameter to `RunPodImageRequest` interface

### 2. ImageGeneration Controller
- Added `artStyle: style` parameter to RunPod service calls

### 3. CharacterImageService.ts  
- Added `artStyle: characterData.artStyle?.primaryStyle` to image generation parameters

## Deployment Notes

### Railway Deployment
Make sure to set these environment variables in your Railway dashboard:
- `RUNPOD_CARTOON_URL`
- `RUNPOD_REALISTIC_URL` 
- `RUNPOD_ANIME_URL`
- `RUNPOD_FANTASY_URL`

### Vercel Deployment
Add these to your Vercel environment variables section.

### Docker Deployment
Include these in your `docker-compose.yml` environment section or `.env` file.

## Security Notes

- Keep your RunPod URLs secure and don't commit them to version control
- Use different RunPod instances for development and production
- Monitor your RunPod usage to avoid unexpected costs

## Future Enhancements

Potential improvements:
- Load balancing between multiple instances of the same checkpoint
- Automatic failover to fallback URL if primary URL is down
- Health monitoring for each art style endpoint
- A/B testing between different model configurations 