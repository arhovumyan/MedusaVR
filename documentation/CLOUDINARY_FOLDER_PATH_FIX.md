# Fix: Cloudinary Folder Path Uses Username Instead of ObjectId

## Problem
The system was using MongoDB ObjectIds (`68658bf000952fc18d365209`) instead of usernames (`testuser`) for Cloudinary folder structures, resulting in folder paths like:
- **Incorrect**: `68658bf000952fc18d365209/characters/opal-fever/images`
- **Correct**: `testuser/characters/opal-fever/images`

## Root Cause
In `EmbeddingBasedImageGenerationService.ts`, the code was directly using `character.creatorId?.toString()` for folder paths instead of fetching the user and using their username.

## Files Modified

### 1. `/server/services/EmbeddingBasedImageGenerationService.ts`

#### Changes Made:
1. **Added UserModel import**:
   ```typescript
   import { UserModel } from '../db/models/UserModel.js';
   ```

2. **Fixed `generateSingleImage()` method**:
   - Added user lookup by `character.creatorId`
   - Used `user.username` instead of `character.creatorId?.toString()`
   - Updated both `getNextImageNumber()` call and `uploadToCharacterFolder()` call

3. **Updated `getNextImageNumber()` method**:
   - Changed parameter name from `userId` to `username` for clarity
   - Method now expects username, not ObjectId

4. **Fixed `getCharacterImages()` method**:
   - Added user lookup by `userId` parameter
   - Used `user.username` for folder path instead of raw `userId`

## Code Changes Summary

### Before:
```typescript
// Direct use of ObjectId
const imageNumber = await this.getNextImageNumber(character.creatorId?.toString() || 'unknown', character.name);

// Upload using ObjectId
const uploadResult = await CloudinaryFolderService.uploadToCharacterFolder(
  character.creatorId?.toString() || 'unknown',
  character.name,
  imageBuffer,
  filename,
  'images'
);

// Folder path using ObjectId
const folderPath = `${userId}/characters/${sanitizedCharacterName}/images`;
```

### After:
```typescript
// Get user information
const user = await UserModel.findById(character.creatorId);
const username = user.username;

// Use username
const imageNumber = await this.getNextImageNumber(username, character.name);

// Upload using username
const uploadResult = await CloudinaryFolderService.uploadToCharacterFolder(
  username,
  character.name,
  imageBuffer,
  filename,
  'images'
);

// Folder path using username
const folderPath = `${username}/characters/${sanitizedCharacterName}/images`;
```

## Impact

### Positive Effects:
- ✅ Human-readable folder structure in Cloudinary
- ✅ Consistent folder naming across all services
- ✅ Easier debugging and manual file management
- ✅ Better organization for users with multiple characters

### Compatibility:
- ✅ Existing images in ObjectId folders remain accessible
- ✅ New images will be stored in username folders
- ✅ No breaking changes to API contracts

## Testing

After this fix, new image generations should show log messages like:
```
🔍 Searching Cloudinary folder: testuser/characters/opal-fever/images
```

Instead of:
```
🔍 Searching Cloudinary folder: 68658bf000952fc18d365209/characters/opal-fever/images
```

## Related Services

### Already Using Username Correctly:
- ✅ `AsyncImageGenerationService.ts` - Uses `user.username`
- ✅ `CharacterEmbeddingService.ts` - Uses `options.username`
- ✅ `FastCharacterGenerationService.ts` - Uses `options.username`

### Fixed in This Update:
- ✅ `EmbeddingBasedImageGenerationService.ts` - Now uses username

## Migration Notes

If you need to migrate existing images from ObjectId folders to username folders, you would need to:

1. Identify users by their ObjectIds
2. Move/copy their character images to the new username-based folder structure
3. Update any database references to the old image URLs

However, this is not strictly necessary as both folder structures can coexist.
