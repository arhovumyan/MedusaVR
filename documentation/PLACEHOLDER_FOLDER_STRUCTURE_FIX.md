# Placeholder Image Folder Structure Fix

## Problem Summary
The placeholder image generation system was using the wrong folder structure when falling back after image generation failures. The images were being saved to folders using ObjectId instead of username, and using the wrong folder hierarchy.

### Issues Fixed:
1. **Wrong folder path**: Images were being uploaded to `{userId}/characters/{characterName}/images/` instead of `{username}/premade_characters/{characterName}/images/`
2. **Inconsistent search vs upload**: System was searching in `{username}/premade_characters/` but uploading to `{userId}/characters/`
3. **Wrong filename pattern**: Using old pattern instead of simplified `username_charactername_image_number.png`

## Backend Logs Analysis
```
🔍 Searching Cloudinary folder: Areg/premade_characters/opal-fever/images
📊 Found 2 images for Opal Fever
...
✅ Uploaded to 686d2b0e8bdef2d1dd1de4ff/characters/opal-fever/images/opalfever_image_1
```

The system was **searching** in the correct folder (`Areg/premade_characters/opal-fever/images`) but **uploading** to the wrong folder (`686d2b0e8bdef2d1dd1de4ff/characters/opal-fever/images/`).

## Changes Made

### 1. Updated PlaceholderImageOptions Interface
**File**: `server/services/PlaceholderImageService.ts`

Added `currentUserId` parameter to support proper folder structure determination:
```typescript
export interface PlaceholderImageOptions {
  characterId?: string;
  characterName?: string;
  prompt?: string;
  userId: string;
  width: number;
  height: number;
  quantity?: number;
  currentUserId?: string; // NEW: The user who is generating the image
}
```

### 2. Updated createTextPlaceholder Method
**File**: `server/services/PlaceholderImageService.ts`

- Added username lookup from `currentUserId`
- Implemented proper folder structure logic
- Updated filename pattern to match simplified convention
- Added proper folder selection (premade_characters vs characters)

```typescript
// Get username from the current user (who is generating the image)
const currentUserId = options.currentUserId || options.userId;
const currentUser = await UserModel.findById(currentUserId);
const username = currentUser.username;

// Generate simplified filename pattern
const filename = `${username}_${sanitizedCharacterName}_image_${imageNumber}`;

// Use appropriate folder structure
if (options.currentUserId) {
  // Current user generating image from existing character - use premade_characters folder
  uploadResult = await CloudinaryFolderService.uploadToPremadeCharacterFolder(
    username, options.characterName, placeholderBuffer, filename, 'images'
  );
} else {
  // Character creator uploading - use standard character folder
  uploadResult = await CloudinaryFolderService.uploadToCharacterFolder(
    username, options.characterName, placeholderBuffer, filename, 'images'
  );
}
```

### 3. Updated getNextImageNumber Method
**File**: `server/services/PlaceholderImageService.ts`

- Changed signature to match `EmbeddingBasedImageGenerationService`
- Updated to use username-based folder paths
- Fixed search pattern to use simplified filename convention

```typescript
private static async getNextImageNumber(
  username: string, 
  characterName: string, 
  isPremadeCharacter: boolean = false
): Promise<number> {
  const folderPath = isPremadeCharacter 
    ? `${username}/premade_characters/${sanitizedCharacterName}/images`
    : `${username}/characters/${sanitizedCharacterName}/images`;
  
  const searchPattern = `${username}_${sanitizedCharacterName}_image_*`;
}
```

### 4. Updated createSinglePlaceholder Method
**File**: `server/services/PlaceholderImageService.ts`

- Applied same username and folder structure logic
- Updated filename generation to match simplified pattern
- Ensured consistency with batch placeholder creation

### 5. Updated AsyncImageGenerationService
**File**: `server/services/AsyncImageGenerationService.ts`

Added `currentUserId` parameter to placeholder service calls:
```typescript
placeholderResult = await PlaceholderImageService.createTextPlaceholder({
  characterId: request.characterId,
  characterName: request.characterName,
  prompt: request.prompt,
  userId: job.userId,
  width: request.width || 1024,
  height: request.height || 1536,
  currentUserId: job.userId // NEW: Pass current user ID for proper folder structure
});
```

## Result
Now when image generation fails and falls back to placeholder creation:

### Before (Broken):
- **Search**: `Areg/premade_characters/opal-fever/images` ✓ (Correct)
- **Upload**: `686d2b0e8bdef2d1dd1de4ff/characters/opal-fever/images/opalfever_image_1` ❌ (Wrong)

### After (Fixed):
- **Search**: `Areg/premade_characters/opal-fever/images` ✓ (Correct)
- **Upload**: `Areg/premade_characters/opal-fever/images/Areg_opal-fever_image_1` ✓ (Correct)

## Folder Structure Summary
1. **User generating image from premade character**: `{username}/premade_characters/{character-name}/images/`
2. **Character creator uploading**: `{username}/characters/{character-name}/images/`
3. **Filename pattern**: `{username}_{character-name}_image_{number}.png`

## Status
✅ **COMPLETED** - All placeholder generation methods now use correct folder structure and filename patterns consistent with the main image generation system.
