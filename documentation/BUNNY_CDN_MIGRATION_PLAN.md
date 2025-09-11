# Bunny CDN Migration Plan

## Overview
Migrating from Cloudinary to Bunny.net for all media storage (images, videos, avatars, texts) while maintaining the same folder structure and functionality.

## Public URL
- Domain: your-domain.com
- CDN URL: https://your-domain.com

## Current Cloudinary Structure to Migrate
```
{username}/
├── avatar/
├── characters/
│   └── {character-name}/
│       ├── avatar/
│       ├── images/
│       ├── variations/
│       ├── embeddings/
│       └── generations/
└── premade_characters/
    └── {character-name}/
        ├── avatar/
        ├── images/
        ├── variations/
        ├── embeddings/
        └── generations/
```

## Current Status: December 13, 2025

### ✅ COMPLETED:
1. **Infrastructure Created**: BunnyStorageService and BunnyFolderService fully implemented
2. **Service Migration**: All services updated to use Bunny CDN instead of Cloudinary:
   - FastCharacterGenerationService ✅
   - CharacterImageService ✅  
   - AsyncImageGenerationService ✅
   - EmbeddingBasedImageGenerationService ✅
   - CharacterEmbeddingService ✅
3. **Upload Controllers**: Updated to use Bunny CDN ✅
4. **Client Components**: Updated ImageUploadService, ProfilePictureUpload, CharacterImageUpload ✅
5. **Folder Structure**: Implemented userName/characters/characterName/{avatar,images,embeddings} ✅
6. **Fallback Logic**: Proper placeholder creation when image generation fails ✅

### ❌ BLOCKING ISSUE:
- **Bunny CDN Authentication Failing**: Getting 401 Unauthorized errors
- **Root Cause**: Storage zone name or access credentials incorrect
- **Current Access Key**: your-bunny-access-key (from FTP settings)
- **Issue**: All API calls return 401, need to verify storage zone name and credentials

### 🔧 NEXT STEPS:
1. **Verify Storage Zone Configuration**: Check Bunny CDN dashboard for correct zone name
2. **Test Authentication**: Confirm access key format (FTP password vs Storage API key)
3. **Update Zone Name**: BunnyStorageService may need correct zone name in URL path

### 📋 VERIFICATION NEEDED:
- What is the exact storage zone name? (currently trying 'medusavr')
- Is the access key correct? (FTP password: 653876-2781-44bf-a09ce3b45f20-51d9-4063)
- Are there separate credentials for Storage API vs FTP?

## Bunny CDN Configuration
From .env:
- BUNNY_API_KEY=your-bunny-api-key
- BUNNY_PASSWORD=your-bunny-password
- BUNNY_EMAIL=your-email@your-domain.com
- BUNNY_ACCESS_KEY=your-bunny-access-key
- BUNNY_STORAGE_API_HOST=https://storage.bunnycdn.com

## Tasks Todo

### Phase 1: Core Infrastructure
- [x] Create BunnyStorageService class (server-side)
- [x] Create BunnyStorageService class (client-side)
- [ ] Update environment variables for Bunny CDN
- [ ] Test basic upload/download functionality

### Phase 2: Replace Cloudinary Services
- [x] Replace CloudinaryFolderService with BunnyFolderService
- [x] Update CharacterImageService to use Bunny CDN
- [x] Update AsyncImageGenerationService to use Bunny CDN
- [x] Update EmbeddingBasedImageGenerationService to use Bunny CDN

### Phase 3: Update Controllers
- [x] Update upload controllers (upload.ts)
- [ ] Update character routes
- [ ] Update user gallery routes

### Phase 4: Update Client Services
- [x] Update ImageUploadService (client)
- [x] Update ProfilePictureUpload component
- [x] Update CharacterImageUpload component
- [x] Update cloudStorage.ts utility

### Phase 5: Update Scripts and Utilities
- [ ] Update migration scripts
- [ ] Update test scripts
- [ ] Update validation scripts

### Phase 6: Environment & Configuration
- [ ] Update Docker configurations
- [ ] Update environment variable references
- [ ] Update build configurations

### Phase 7: Testing & Validation
- [ ] Test avatar uploads
- [ ] Test character image generation
- [ ] Test batch uploads
- [ ] Test folder structure creation
- [ ] Test image retrieval and URLs
- [ ] Build and run application

### Phase 8: Cleanup
- [ ] Remove Cloudinary dependencies where not needed
- [ ] Update documentation
- [ ] Review security configurations

## Files to Modify

### Server Files
1. `/server/services/CloudinaryFolderService.ts` → `/server/services/BunnyFolderService.ts`
2. `/server/services/CharacterImageService.ts`
3. `/server/services/AsyncImageGenerationService.ts`
4. `/server/services/EmbeddingBasedImageGenerationService.ts`
5. `/server/services/ImageIndexManager.ts`
6. `/server/controllers/upload.ts`
7. `/server/routes/character.ts`
8. `/server/routes/userGallery.ts`
9. All test scripts in `/server/scripts/`

### Client Files
1. `/client/src/lib/cloudStorage.ts` → `/client/src/lib/bunnyStorage.ts`
2. `/client/src/lib/imageUpload.ts`
3. `/client/src/components/ui/ProfilePictureUpload.tsx`
4. `/client/src/components/ui/CharacterImageUpload.tsx`

### Configuration Files
1. `.env` (already has Bunny credentials)
2. `docker-compose.yml`
3. `Dockerfile.backend`
4. `Dockerfile.client`

## Security Considerations
- Ensure proper access control with Bunny CDN
- Validate file types and sizes
- Implement proper authentication
- Set up CORS policies
- Implement rate limiting

## Notes
- Maintain exact same folder structure as Cloudinary
- Preserve all existing functionality
- Ensure backward compatibility during migration
- Test thoroughly before deployment
