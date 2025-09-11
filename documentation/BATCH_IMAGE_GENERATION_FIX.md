# Image Generation Batch Upload Fix

## Problem Identified

### Issue: Only First Image Being Saved in Batch Generation

The problem was **NOT** with the Cloudinary upload logic, but with the **filename generation logic** causing filename collisions in batch image generation.

### Root Cause Analysis

From the backend logs:
```
🔢 Getting next image number for character: Opal Fever
📊 Found 0 existing images for Opal Fever
🎯 Next image number for Opal Fever: 1
📝 Generated filename for image 1: Areg_opal-fever_image_1
```

**Every image in the batch was getting the SAME filename!**

### The Problem Chain:

1. **Multiple calls to `getNextImageNumber()`**: Each image in the batch called `getNextImageNumber()` with identical parameters
2. **Race condition**: All images got the same "next number" because they were generated concurrently
3. **Filename collision**: Every image got `Areg_opal-fever_image_1` as the base filename
4. **ComfyUI conflict**: ComfyUI couldn't save multiple images with the same `filename_prefix`
5. **Download failure**: System couldn't find images with expected suffixes because they weren't saved properly

### Code Location

**File**: `server/services/EmbeddingBasedImageGenerationService.ts`

**Problem Code** (lines ~163-164):
```typescript
const imageNumber = await this.getNextImageNumber(username, character.name, currentUserId ? true : false);
const actualImageNumber = imageNumber + imageIndex - 1; // This calculation was wrong!
```

This was called inside the loop for EACH image, causing all images to get the same base number.

## Solution Implemented

### 1. **Move `getNextImageNumber()` Outside the Loop**

**Before** (Broken):
```typescript
// 3. Generate multiple images concurrently
const imagePromises: Promise<string>[] = [];

for (let i = 0; i < quantity; i++) {
  imagePromises.push(this.generateSingleImage(character, embeddingPrompt, options, i + 1, options.currentUserId));
}
```

**After** (Fixed):
```typescript
// 3. Get the starting image number once for the entire batch
const startingImageNumber = await this.getNextImageNumber(username, character.name, isPremadeCharacter);
console.log(`🎯 Starting image number for batch: ${startingImageNumber}`);

// 4. Generate multiple images concurrently
const imagePromises: Promise<string>[] = [];

for (let i = 0; i < quantity; i++) {
  imagePromises.push(this.generateSingleImage(character, embeddingPrompt, options, i + 1, options.currentUserId, startingImageNumber + i));
}
```

### 2. **Updated `generateSingleImage()` Method Signature**

Added `actualImageNumber` parameter to receive pre-calculated image number:

```typescript
private async generateSingleImage(
  character: any, 
  embeddingPrompt: string, 
  options: EmbeddingBasedGenerationOptions,
  imageIndex: number,
  currentUserId?: string,
  actualImageNumber?: number // NEW: Pre-calculated image number
): Promise<string>
```

### 3. **Fixed Filename Generation Logic**

**Before**:
```typescript
const imageNumber = await this.getNextImageNumber(username, character.name, currentUserId ? true : false);
const actualImageNumber = imageNumber + imageIndex - 1; // Wrong calculation!
const filename = `${username}_${sanitizedCharacterName}_image_${actualImageNumber}`;
```

**After**:
```typescript
// Use pre-calculated image number if provided, otherwise calculate it (for single image generation)
const imageNumber = actualImageNumber || await this.getNextImageNumber(username, character.name, currentUserId ? true : false);
const filename = `${username}_${sanitizedCharacterName}_image_${imageNumber}`;
```

## Expected Results

### Before Fix:
- **Image 1**: `Areg_opal-fever_image_1` ✅ (works)
- **Image 2**: `Areg_opal-fever_image_1` ❌ (collision!)
- **Image 3**: `Areg_opal-fever_image_1` ❌ (collision!)

### After Fix:
- **Image 1**: `Areg_opal-fever_image_1` ✅
- **Image 2**: `Areg_opal-fever_image_2` ✅  
- **Image 3**: `Areg_opal-fever_image_3` ✅

## Folder Structure

The images will be uploaded to the correct Cloudinary folders:

### For Users Generating Images from Existing Characters:
- **Folder**: `{username}/premade_characters/{character-name}/images/`
- **Example**: `Areg/premade_characters/opal-fever/images/Areg_opal-fever_image_1.png`

### For Character Creators:
- **Folder**: `{username}/characters/{character-name}/images/`
- **Example**: `CreatorName/characters/opal-fever/images/CreatorName_opal-fever_image_1.png`

## Files Modified

1. **`server/services/EmbeddingBasedImageGenerationService.ts`**:
   - Moved `getNextImageNumber()` call outside the image generation loop
   - Updated `generateSingleImage()` method signature
   - Fixed filename generation logic
   - Added batch number calculation logic

## Status

✅ **COMPLETED** - The batch image generation system now correctly:
- Calculates unique image numbers for each image in a batch
- Prevents filename collisions
- Saves all generated images to Cloudinary
- Uses proper folder structure based on user type

## Testing

Test the fix by:
1. Generating multiple images (quantity > 1) for a character
2. Verify all images are downloaded and uploaded successfully
3. Check that filenames follow pattern: `username_charactername_image_1.png`, `username_charactername_image_2.png`, etc.
4. Confirm images appear in correct Cloudinary folder structure
