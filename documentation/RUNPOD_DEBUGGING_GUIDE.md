# RunPod Image Generation Debugging Guide

## Current Issues Identified

Based on your test results:
1. ✅ **Environment Variables**: Correctly configured
2. ❌ **RunPod API Calls**: Returning 405 (Method Not Allowed) errors
3. ❌ **Image Generation**: Falling back to default images

## Step-by-Step Debugging

### 1. Test Basic URL Connectivity

First, test if the RunPod URLs are reachable:

```bash
# Test anime URL connectivity (should use 7861)
GET http://localhost:5002/api/test/runpod-ping/anime

# Test realistic URL connectivity (should use 7860)
GET http://localhost:5002/api/test/runpod-ping/realistic
```

**Expected Response:**
```json
{
  "success": true,
  "artStyle": "anime",
  "testUrl": "https://423xliueu5koxj-7861.proxy.runpod.net/",
  "responseStatus": 200,
  "responseOk": true,
  "message": "URL is reachable"
}
```

### 2. Test Image Generation (GET - Easy Browser Test)

```bash
# Test anime generation (browser-friendly)
GET http://localhost:5002/api/test/image-generation/anime

# Test realistic generation
GET http://localhost:5002/api/test/image-generation/realistic
```

### 3. Check Server Logs

When creating a character, look for these specific log messages:

```
🎨 Starting character avatar generation...
📋 Input character data: {...}
🎯 Art style selected: anime
🔧 Generation options: {...}
🎨 Starting consistent character generation...
🔍 Getting WebUI URL for style: "anime"
🔧 Environment variables: {...}
🎨 Using anime/cartoon/fantasy checkpoint: https://423xliueu5koxj-7861.proxy.runpod.net/
📝 Generated prompt: anime, female, ...
🚀 Calling RunPod service...
📡 RunPod response status: 200
📊 RunPod result: {...}
✅ Image generation successful, proceeding to Cloudinary upload...
```

### 4. Common Issues & Solutions

#### Issue: 405 Method Not Allowed
This suggests the RunPod endpoint doesn't support the `/sdapi/v1/txt2img` endpoint.

**Possible Solutions:**
1. Check if your RunPod instance is running Automatic1111 WebUI
2. Verify the WebUI API is enabled
3. Try alternative endpoint: `/api/v1/txt2img` instead of `/sdapi/v1/txt2img`

#### Issue: Environment Variables Not Set
**Solution:** Add to your `.env` file:
```bash
RUNPOD_ANIME_CARTOON_FANTASY_URL=https://423xliueu5koxj-7861.proxy.runpod.net/
RUNPOD_REALISTIC_URL=https://423xliueu5koxj-7860.proxy.runpod.net/
```

#### Issue: Model Loading Timeouts
**Solutions:**
- Wait 2-5 minutes for model loading
- Use models that are already loaded
- Reduce generation parameters (steps, resolution)

### 5. Manual RunPod Testing

Test your RunPod endpoints directly with curl:

```bash
# Test anime endpoint (7861)
curl -X POST "https://423xliueu5koxj-7861.proxy.runpod.net/sdapi/v1/txt2img" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "anime girl",
    "negative_prompt": "blurry",
    "width": 512,
    "height": 512,
    "steps": 10,
    "cfg_scale": 7
  }'

# Test realistic endpoint (7860)
curl -X POST "https://423xliueu5koxj-7860.proxy.runpod.net/sdapi/v1/txt2img" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "realistic woman",
    "negative_prompt": "blurry",
    "width": 512,
    "height": 512,
    "steps": 10,
    "cfg_scale": 7
  }'
```

### 6. Alternative Endpoints to Try

If `/sdapi/v1/txt2img` doesn't work, try these:

1. `/api/v1/txt2img`
2. `/txt2img`
3. `/generate`

### 7. Verify WebUI Configuration

Your RunPod instances should have:
- ✅ Automatic1111 WebUI installed
- ✅ API enabled (`--api` flag)
- ✅ CORS enabled if needed (`--cors` flag)
- ✅ Models loaded and ready

### 8. Debug Character Creation

Monitor the complete character creation flow:

1. **Frontend**: Check browser console for creation request
2. **Backend**: Check server logs for image generation attempts
3. **RunPod**: Check if requests reach RunPod successfully
4. **Fallback**: Verify why it falls back to default images

### 9. Emergency Fixes

If RunPod continues to fail:

**Option 1: Disable Image Generation Temporarily**
```typescript
// In CharacterImageService.ts, force failure:
return {
  success: false,
  error: 'Image generation temporarily disabled for debugging'
};
```

**Option 2: Test with Different Models**
Update the model in RunPodService.ts:
```typescript
const targetModel = 'sd_xl_base_1.0.safetensors'; // Try different model
```

### 10. Success Indicators

✅ **URL Ping Test**: Returns 200 status
✅ **Manual curl**: Returns image data
✅ **Generation Test**: Returns success with imageUrl
✅ **Character Creation**: Uses generated image, not placeholder

## Next Steps

1. Run the URL ping tests first
2. Check server logs during character creation
3. Test manual curl commands
4. Report back with specific error messages

The 405 errors suggest your RunPod endpoints might not be running the expected Automatic1111 WebUI API interface. 