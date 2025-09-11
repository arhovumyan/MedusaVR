# RunPod Image Generation Integration

This integration allows your users to generate images using your RunPod Stable Diffusion WebUI instance directly from your website.

## Setup Instructions

### 1. Configure Environment Variables

Add your RunPod WebUI URL to your server's `.env` file:

```bash
# RunPod Configuration
RUNPOD_WEBUI_URL=https://your-pod-id-7860.proxy.runpod.net
# Or for local testing: RUNPOD_WEBUI_URL=http://localhost:7860
```

Replace `your-pod-id-7860.proxy.runpod.net` with your actual RunPod proxy URL.

### 2. Ensure Your RunPod Instance is Ready

Make sure your RunPod instance is running with:
- Stable Diffusion WebUI loaded
- API enabled (--api flag)
- Models and LORAs uploaded
- Accessible via the proxy URL

### 3. Test the Integration

Run the test script to verify everything is working:

```bash
npm run test:runpod
```

This will check:
- ✅ RunPod configuration
- ✅ Health check connectivity  
- ✅ Available models and samplers
- ✅ Image generation (if configured)

### 4. Start Your Server

```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /api/image-generation/health
```
Returns the status of your RunPod connection.

### Get Available Models
```
GET /api/image-generation/models
```
Returns available models, samplers, LORAs, and configuration options.

### Generate Image
```
POST /api/image-generation/generate
```
Generates an image using your RunPod instance.

Example request body:
```json
{
  "prompt": "masterpiece, best quality, anime coloring, anime screenshot, 1girl, squatting, panties, solo, space ship, indoors, Yuki Mori, black_hair, short_hair, purple_eyes, huge_breasts, wavy hair, blue bodysuit, mature female, 20YO",
  "negativePrompt": "blurry, bad anatomy, extra limbs, low quality",
  "width": 512,
  "height": 768,
  "steps": 20,
  "cfgScale": 8,
  "sampler": "Euler a",
  "model": "ILustMix.safetensors",
  "loras": [
    {
      "name": "bra_cups_sticking_out",
      "strength": 0.5
    }
  ],
  "enableHr": true,
  "hrUpscaler": "Latent",
  "hrScale": 2,
  "denoisingStrength": 0.4
}
```

## Frontend Integration

Use the `RunPodImageGenerator` component to provide a complete UI for your users:

```tsx
import { RunPodImageGenerator } from '@/components/RunPodImageGenerator';

function MyPage() {
  return <RunPodImageGenerator />;
}
```

## Features

### ✨ Supported Features
- **Dynamic Model Selection**: Automatically fetches available models from your RunPod
- **LORA Support**: Users can select and adjust LORA strengths
- **Advanced Settings**: Steps, CFG scale, samplers, high-resolution enhancement
- **Style Presets**: Pre-configured settings for different art styles
- **Real-time Status**: Shows RunPod connection status
- **Fallback System**: Gracefully handles offline/error states
- **Image Management**: Generated images are uploaded to Cloudinary

### 🎛️ User Controls
- **Prompt & Negative Prompt**: Full text input
- **Style Selection**: Anime, realistic, fantasy, etc.
- **Dimensions**: Multiple preset sizes
- **LORAs**: Checkbox selection with strength sliders
- **Advanced Settings**: Collapsible panel with expert controls
- **Seed Control**: Random or specific seed input

## Architecture

```
User Input (Frontend) 
    ↓
Backend API (/api/image-generation/generate)
    ↓  
RunPodService.generateImage()
    ↓
HTTP POST to RunPod WebUI (/sdapi/v1/txt2img)
    ↓
Base64 Image Response
    ↓
Upload to Cloudinary
    ↓
Return Image URL to User
```

## Error Handling

The system includes comprehensive error handling:

1. **RunPod Offline**: Falls back to dummy image generation
2. **Invalid Models**: Uses default model if specified model not found
3. **Network Errors**: Retries and provides user feedback
4. **Cloudinary Failures**: Returns direct image data as fallback

## Monitoring & Debugging

- Check `/api/image-generation/health` for service status
- Monitor server logs for RunPod API responses
- Use `npm run test:runpod` for troubleshooting

## Security Considerations

- All image generation requires user authentication
- Rate limiting is recommended for production
- Consider implementing usage quotas per user
- Monitor RunPod costs and set spending limits

## Scaling

For high-traffic applications:
- Use multiple RunPod instances behind a load balancer
- Implement queue system for batch processing
- Cache frequently requested images
- Consider auto-scaling RunPod instances based on demand
