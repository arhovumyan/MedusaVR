# Simplified Image Filename Structure

## Changes Made

### New Filename Pattern
Changed from complex naming to simple pattern:
- **Before**: `character-name_image_000001_00001`
- **After**: `{username}_{characterName}_image_{number}`

### Examples:
- `testuser_opal-fever_image_1.png`
- `testuser_opal-fever_image_2.png`  
- `testuser_opal-fever_image_3.png`

## Code Changes

### 1. Simplified Filename Generation
```typescript
// OLD (complex)
const paddedImageNumber = imageNumber.toString().padStart(6, '0');
const paddedBatchIndex = imageIndex.toString().padStart(5, '0');
const filename = `${sanitizedCharacterName}_image_${paddedImageNumber}_${paddedBatchIndex}`;

// NEW (simple)
const actualImageNumber = imageNumber + imageIndex - 1;
const filename = `${username}_${sanitizedCharacterName}_image_${actualImageNumber}`;
```

### 2. Updated Search Pattern
```typescript
// OLD (multiple patterns)
const searchResult = await cloudinary.search
  .expression(`folder:${folderPath} AND (public_id:${oldSanitizedName}_image_* OR public_id:${newSanitizedName}_image_*)`)

// NEW (single pattern)
const searchPattern = `${username}_${sanitizedCharacterName}_image_*`;
const searchResult = await cloudinary.search
  .expression(`folder:${folderPath} AND public_id:${searchPattern}`)
```

### 3. Simplified Regex Matching
```typescript
// OLD (complex pattern matching)
const oldMatch = publicId.match(new RegExp(`${oldSanitizedName}_image_(\\d+)(?:_\\d+)?$`));
const newMatch = publicId.match(new RegExp(`${newSanitizedName}_image_(\\d+)(?:_\\d+)?$`));

// NEW (single pattern)
const match = publicId.match(new RegExp(`${username}_${sanitizedCharacterName}_image_(\\d+)$`));
```

### 4. Clean Upload Filename
```typescript
// Use clean filename for Cloudinary upload (without ComfyUI suffix)
const cleanFilename = `${username}_${sanitizedCharacterName}_image_${actualImageNumber}`;
```

## How It Works

### Image Generation Flow:
1. **User generates 3 images** for character "Opal Fever"
2. **ComfyUI saves** them as:
   - `testuser_opal-fever_image_1_00001_.png`
   - `testuser_opal-fever_image_2_00001_.png` 
   - `testuser_opal-fever_image_3_00001_.png`
3. **System downloads** each image by trying ComfyUI's suffix patterns
4. **Cloudinary saves** them with clean names:
   - `testuser_opal-fever_image_1`
   - `testuser_opal-fever_image_2`
   - `testuser_opal-fever_image_3`

### Folder Structure:
```
testuser/
└── premade_characters/
    └── opal-fever/
        └── images/
            ├── testuser_opal-fever_image_1.png
            ├── testuser_opal-fever_image_2.png
            └── testuser_opal-fever_image_3.png
```

## Benefits

### 1. Clear Naming
- ✅ Easy to understand who generated the image
- ✅ Clear character association
- ✅ Sequential numbering

### 2. Consistent Downloads
- ✅ Finds all generated images in batch
- ✅ Handles ComfyUI's automatic suffix system
- ✅ Sequential numbering across batches

### 3. Simpler Management
- ✅ No complex padding or batch indexing
- ✅ Easier to search and organize
- ✅ Human-readable filenames

## Testing

When you generate multiple images, you should see:

### Log Messages:
```
📝 Generated filename for image 1: testuser_opal-fever_image_1
📝 Generated filename for image 2: testuser_opal-fever_image_2  
📝 Generated filename for image 3: testuser_opal-fever_image_3
🔍 Trying to download image 1, attempt 1: testuser_opal-fever_image_1_00001_.png
✅ Found image 1 with suffix 00001. Size: 1024.5KB
📂 Uploaded to premade character folder: testuser/premade_characters/opal-fever/images
```

### Expected Results:
- All images in batch should be downloaded successfully
- Images saved with clean, sequential names
- Next batch continues numbering from where previous batch ended
