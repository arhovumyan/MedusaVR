# Image Indexing System for Premade Characters

## Overview

This document describes the new automatic image indexing system that was implemented for premade character image generation. When users generate images with existing characters, the system now automatically creates a proper folder structure and tracks image numbers using an index.txt file.

## Folder Structure

For premade character images, the following folder structure is automatically created:

```
userName/
  premade_characters/
    characterName/
      images/
        index.txt
        userName_characterName_image_1.png
        userName_characterName_image_2.png
        userName_characterName_image_3.png
        ...
```

### Example

For user "tester" generating images with character "bobo":

```
tester/
  premade_characters/
    bobo/
      images/
        index.txt
        tester_bobo_image_1.png
        tester_bobo_image_2.png
        tester_bobo_image_3.png
        ...
```

## Index Tracking System

### index.txt File

- Located in the `images/` folder of each character
- Contains a single number representing the current image count
- Automatically created with value "0" when the folder structure is first set up
- Incremented by 1 each time a new image is generated

### How It Works

1. **First Image Generation**: 
   - System checks if folder structure exists, creates it if not
   - Creates `index.txt` with value "0"
   - Reads current value (0), increments to 1
   - Saves image as `userName_characterName_image_1.png`
   - Updates `index.txt` to "1"

2. **Subsequent Image Generation**:
   - Reads current value from `index.txt` (e.g., "3")
   - Increments to next number (4)
   - Saves image as `userName_characterName_image_4.png`
   - Updates `index.txt` to "4"

## Implementation Details

### Core Services

1. **ImageIndexService** (`server/services/ImageIndexService.ts`)
   - Handles all index.txt file operations
   - Manages folder structure creation
   - Generates proper filenames with indexing

2. **BunnyFolderService** (Updated)
   - Added `uploadPremadeCharacterImageWithIndexing()` method
   - Integrates with ImageIndexService for seamless uploads

3. **AsyncImageGenerationService** (Updated)
   - Modified to use indexed uploads for premade characters
   - Maintains backward compatibility for character creation

### Integration Points

The new system is automatically used when:
- **GenerateImagesPage.tsx**: User generates images from the generate images page
- **ChatPage.tsx**: User generates images from within a chat with a character

Both scenarios now use the same indexing system when `userId` and `characterId` are provided (indicating it's a premade character image generation).

## Naming Convention

### For Premade Characters (New System)
- Format: `userName_characterName_image_X.png`
- Example: `tester_bobo_image_1.png`
- Character names are sanitized (lowercase, non-alphanumeric replaced with hyphens)

### For Character Creation (Existing System)
- Format: `userName_characterName_image_0001.png` (padded)
- This maintains backward compatibility

## RunPod Integration

The system is designed to work with RunPod's automatic numbering:
- RunPod generates images with format: `username_characterName_image_00001_`
- Our system downloads these and renames them using our indexing system
- This ensures consistent naming regardless of RunPod's internal numbering

## API Endpoints

### Test Endpoints

For testing and verification, the following endpoints are available:

1. **Check Structure**: `GET /api/test-image-index/check-structure/:username/:characterName`
   - Verifies folder structure exists
   - Shows current index and next number
   - Returns example filename

2. **Simulate Upload**: `POST /api/test-image-index/simulate-upload`
   - Body: `{ "username": "testuser", "characterName": "testchar" }`
   - Simulates a full image upload with indexing
   - Uses a dummy 1x1 PNG for testing

3. **Reset Index**: `POST /api/test-image-index/reset-index`
   - Body: `{ "username": "testuser", "characterName": "testchar" }`
   - Resets the image index to 0 for testing

4. **Get Stats**: `GET /api/test-image-index/stats/:username/:characterName`
   - Returns current statistics for a character's images

### Example Usage

```bash
# Check folder structure for user "tester" and character "bobo"
curl "http://localhost:3000/api/test-image-index/check-structure/tester/bobo"

# Simulate uploading an image
curl -X POST "http://localhost:3000/api/test-image-index/simulate-upload" \
  -H "Content-Type: application/json" \
  -d '{"username": "tester", "characterName": "bobo"}'

# Get current stats
curl "http://localhost:3000/api/test-image-index/stats/tester/bobo"
```

## Error Handling

The system includes robust error handling:

1. **Fallback Naming**: If indexing fails, falls back to timestamp-based numbering
2. **Folder Creation**: Automatically creates necessary folder structure
3. **Index File Recovery**: Creates index.txt if it doesn't exist or is corrupted
4. **Retry Logic**: Built-in retry mechanisms for Bunny CDN uploads

## Security Considerations

- Character names are sanitized to prevent path traversal attacks
- All file operations use Bunny CDN's secure storage service
- Index files are stored as plain text for simplicity and reliability

## Performance

- Index tracking adds minimal overhead (single file read/write per image)
- Folder structure is created lazily (only when first image is generated)
- Caching could be added in the future if needed for high-volume scenarios

## Migration

This is an additive change that:
- **Does not affect existing images** - they remain in their current locations
- **Only applies to new premade character image generation**
- **Maintains full backward compatibility** with existing systems

## Future Enhancements

Potential improvements that could be added:

1. **Batch Operations**: Optimize for multiple images generated simultaneously
2. **Index Caching**: Cache index values in memory for high-volume scenarios
3. **Cleanup Tools**: Administrative tools to rebuild indexes from existing files
4. **Analytics**: Track image generation statistics per character/user
