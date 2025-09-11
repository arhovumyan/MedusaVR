# MedusaVR Scalable Character Generation System

This advanced character generation system extends your existing `simplified_tester.sh` workflow into a scalable, production-ready solution that:

## 🚀 Key Features

- **Fast Generation**: Uses your existing RunPod infrastructure with optimized workflow
- **Cloudinary Integration**: Creates organized folder structures for each character  
- **Database Storage**: Saves complete character metadata to MongoDB
- **Embeddings**: Creates character embeddings for search and recommendations
- **Batch Processing**: Generate multiple characters efficiently
- **Cache Management**: Maintains image number cache for consistency

## 📁 Folder Structure Created

For each character, the system creates:
```
cloudinary/
└── {username}/
    └── characters/
        └── {character-name}/
            ├── avatar/           # Character profile images
            ├── images/           # Generated character images
            ├── variations/       # Character variations (face, body, outfit)
            ├── embeddings/       # Character embeddings for search
            └── generations/      # All generation history
```

## 🛠️ Quick Start

### Prerequisites

1. Ensure your RunPod environment is running with the correct URL in `.env`:
```bash
RUNPOD_WEBUI_URL=https://your-runpod-url-7861.proxy.runpod.net
```

2. Make sure your prompt files exist in `/root/`:
- `positive_prompt.txt` - Your positive prompts
- `negative_prompt.txt` - Your negative prompts

3. Cloudinary credentials in `.env`:
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Usage Examples

#### 1. Generate Single Character
```bash
cd server
npm run fast-generate -- --name "Luna Starweaver" --description "A mystical elven sorceress with silver hair" --style fantasy
```

#### 2. Generate Batch Characters (Recommended)
```bash
npm run generate-batch
# Generates 5 characters from predefined templates
```

#### 3. Custom Batch Generation
```bash
npm run fast-generate -- --batch-templates --count 3
```

#### 4. Advanced Single Character
```bash
npm run fast-generate -- \
  --name "Aria Cybershade" \
  --description "A cyberpunk hacker with neon hair" \
  --style anime \
  --tags "rebellious,confident,tech-savvy" \
  --steps 30 \
  --cfg 8
```

## 🎯 Performance Comparison

| Method | Speed | Scalability | Features |
|--------|-------|-------------|----------|
| `simplified_tester.sh` | ⭐⭐⭐ | ⭐ | Basic image generation |
| **New System** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Full character ecosystem |

### Speed Improvements:
- **Parallel Processing**: Multiple characters generated simultaneously
- **Optimized Workflow**: Reuses existing RunPod infrastructure
- **Smart Caching**: Maintains image number continuity
- **Efficient Uploads**: Direct buffer uploads to Cloudinary

## 🎨 Character Image Generation

### 1. Generate Additional Images for Existing Characters
```bash
# Use character embeddings to generate consistent images
curl -X POST "http://localhost:3001/api/characters/123456/generate-image" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "imageType": "portrait",
    "mood": "happy",
    "setting": "magical forest"
  }'
```

### 2. Available Image Types
- **`portrait`**: Close-up character portrait
- **`full-body`**: Complete character view
- **`action`**: Dynamic action pose
- **`variation`**: Character variations
- **`custom`**: Custom prompt-based generation

### 3. Using Character Embeddings
The system generates embeddings for each character that ensure:
- **Consistent Identity**: Same character features across images
- **Style Continuity**: Maintains art style preferences
- **Personality Reflection**: Images reflect character traits
- **Semantic Search**: Find similar characters by traits

### 4. Image Organization
All images are organized in character-specific folders:
```
cloudinary/
└── {username}/
    └── characters/
        └── {character-name}/
            ├── avatar/           # Profile images
            ├── images/           # General character images
            ├── variations/       # Character variations
            └── embeddings/       # Character embeddings
```

## 📊 What Gets Created

For each character, the system creates:

### 1. Database Entry
```javascript
{
  id: 123456,
  name: "Luna Starweaver",
  avatar: "https://cloudinary.../avatar.png",
  description: "A mystical elven sorceress...",
  personalityTraits: {
    mainTrait: "mysterious",
    subTraits: ["wise", "caring", "magical"]
  },
  selectedTags: {
    'character-type': ["female"],
    'genre': ["fantasy"],
    'personality': ["mysterious", "wise"]
  },
  imageGeneration: {
    prompt: "masterpiece, best quality...",
    seed: 2468013579,
    characterSeed: 2468013579
  },
  embeddings: {
    url: "https://cloudinary.../embeddings.json",
    dimension: 384
  }
}
```

### 2. Cloudinary Assets
- **Avatar Image**: High-quality character portrait
- **Embeddings File**: JSON with character embeddings
- **Organized Folders**: Ready for future image generations

### 3. Character Seed
Each character gets a consistent seed based on name + description, ensuring:
- Same character always generates similar base features
- Variations maintain character identity
- Reproducible results

## 🔧 Advanced Configuration

### Custom Prompts
```bash
npm run fast-generate -- \
  --positive-prompt "/path/to/custom_positive.txt" \
  --negative-prompt "/path/to/custom_negative.txt"
```

### Different Models
```bash
npm run fast-generate -- --model "your_custom_model.safetensors"
```

### Custom User
```bash
npm run fast-generate -- --userId "your_user_id" --username "your_username"
```

## 🚨 Important Notes

1. **RunPod Connection**: Ensure your RunPod environment is active and accessible
2. **Image Cache**: The system maintains `.last_image_number` cache in `/root/` - don't delete this
3. **Generation Time**: Each character takes ~10-15 seconds (7.5s generation + upload time)
4. **Batch Limits**: Recommended batch size is 2-3 characters to avoid RunPod timeouts
5. **Folder Structure**: Character folders are created automatically but won't be deleted

## 🔄 Migration from simplified_tester.sh

Your existing `simplified_tester.sh` continues to work! The new system:
- Uses the same RunPod endpoints
- Maintains the same cache file
- Uses the same prompt files
- Just adds database storage and Cloudinary organization

## 🐛 Troubleshooting

### Common Issues:

1. **"RunPod connection failed"**
   - Check your `RUNPOD_WEBUI_URL` in `.env`
   - Ensure RunPod environment is running

2. **"Cloudinary upload failed"**
   - Verify Cloudinary credentials in `.env`
   - Check network connectivity

3. **"Database connection failed"**
   - Verify `MONGODB_URI` in `.env`
   - Ensure MongoDB is accessible

4. **"Image download failed"**
   - RunPod generation might have failed
   - Check RunPod logs
   - Try reducing batch size

### Debug Mode:
Add console logging by setting:
```bash
NODE_ENV=development npm run fast-generate -- [options]
```

## 📈 Future Enhancements

The system is designed to support:
- **Character Variations**: Generate face/body/outfit variations
- **Character Regeneration**: Regenerate with same seed for consistency
- **Embedding Search**: Find similar characters
- **Style Transfer**: Apply different art styles to existing characters
- **Batch Optimization**: Even faster generation with improved caching

## 🎉 Success Metrics

After running the system, you'll see:
```
📊 Fast batch generation summary:
✅ Successful: 5
❌ Failed: 0
📈 Success rate: 100.0%

🎉 Characters created:
✅ 1. Luna Starweaver - ID: 123456 (12s)
✅ 2. Zara Cybershade - ID: 123457 (11s)
✅ 3. Captain Aria Blackwater - ID: 123458 (13s)
```

This system transforms your image generation workflow into a complete character creation ecosystem! 🎭✨
