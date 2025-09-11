import { Router, Request, Response } from 'express';
import { BunnyFolderService } from '../services/BunnyFolderService.js';
import { BunnyStorageService } from '../services/BunnyStorageService.js';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { UserModel } from '../db/models/UserModel.js';
import { requireAuth } from '../middleware/auth.js';
import { cacheService } from '../services/CacheService.js';

const router = Router();

interface UserImage {
  id: string;
  url: string;
  characterName: string;
  characterId: string;
  characterAvatar?: string;
  prompt?: string;
  createdAt: string;
  isNsfw?: boolean;
}

interface CharacterGroup {
  characterId: string;
  characterName: string;
  characterAvatar?: string;
  images: UserImage[];
  totalImages: number;
  isNsfw?: boolean;
}

/**
 * Get all user images organized by character
 * Returns images from both:
 * - username/characters/{character-name}/images/ (created characters)
 * - username/premade_characters/{character-name}/images/ (used existing characters)
 */
router.get('/:username', requireAuth, async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const authUserId = req.user?.id;
    
    // Verify the user exists and the requesting user has permission
    const targetUser = await UserModel.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Users can only view their own gallery
    if (targetUser._id.toString() !== authUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own image gallery.'
      });
    }

    console.log(`🖼️ Fetching image gallery for user: ${username} from Bunny CDN`);

    // ===== CACHE CHECK =====
    try {
      const cachedGallery = await cacheService.getUserImages(username, '*');
      if (cachedGallery && Array.isArray(cachedGallery) && cachedGallery.length > 0) {
        console.log(`🎯 Cache HIT: Found ${cachedGallery.length} cached gallery items for ${username}`);
        return res.json({
          success: true,
          data: cachedGallery
        });
      }
      console.log(`💨 Cache MISS: No cached gallery for ${username}`);
    } catch (error) {
      console.warn('⚠️ Cache read error (continuing without cache):', error);
    }

    // Get images from both character folders and premade character folders
    const characterGroups: Map<string, CharacterGroup> = new Map();

    // Helper function to process image files and create UserImage objects
    const processImageFiles = (files: string[], folderPath: string, characterName: string, character: any) => {
      const images: UserImage[] = [];
      
      for (const filename of files) {
        // Skip index.txt and other non-image files
        if (!filename.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
          continue;
        }
        
        const imageUrl = BunnyStorageService.getPublicUrl(`${folderPath}/${filename}`);
        
        images.push({
          id: `${folderPath}/${filename}`,
          url: imageUrl,
          characterName: character?.name || characterName,
          characterId: character?.id || characterName,
          characterAvatar: character?.avatar || character?.avatarUrl,
          createdAt: new Date().toISOString(), // We don't have creation date from Bunny, use current time
          isNsfw: character?.isNsfw || false
        });
      }
      
      return images;
    };

    // 1. Get images from user's created characters folder
    try {
      const charactersFolder = `${username}/characters`;
      const characterFoldersResult = await BunnyStorageService.listFiles(charactersFolder);
      
      if (characterFoldersResult.success && characterFoldersResult.files) {
        // Extract character folder names from file paths
        const characterFolders = new Set<string>();
        for (const file of characterFoldersResult.files) {
          const parts = file.split('/');
          if (parts.length > 0) {
            characterFolders.add(parts[0]);
          }
        }
        
        for (const characterName of characterFolders) {
          const imagesFolder = `${charactersFolder}/${characterName}/images`;
          
          try {
            const imagesResult = await BunnyStorageService.listFiles(imagesFolder);
            
            if (imagesResult.success && imagesResult.files && imagesResult.files.length > 0) {
              // Try to find the character in database
              let character = null;
              try {
                character = await CharacterModel.findOne({ 
                  name: { $regex: new RegExp(`^${characterName.replace(/-/g, ' ')}$`, 'i') },
                  creatorId: targetUser._id 
                });
              } catch (error) {
                console.log(`Could not find character ${characterName} in database`);
              }

              const images = processImageFiles(imagesResult.files, imagesFolder, characterName, character);

              if (images.length > 0) {
                const groupKey = character?.id || characterName;
                characterGroups.set(groupKey, {
                  characterId: character?.id || characterName,
                  characterName: character?.name || characterName.replace(/-/g, ' '),
                  characterAvatar: character?.avatar || character?.avatarUrl,
                  images: images,
                  totalImages: images.length,
                  isNsfw: character?.isNsfw || false
                });
              }
            }
          } catch (error) {
            console.log(`No images found in folder: ${imagesFolder}`);
          }
        }
      }
    } catch (error) {
      console.log(`No characters folder found for user: ${username}`);
    }

    // 2. Get images from user's premade characters folder
    try {
      const premadeCharactersFolder = `${username}/premade_characters`;
      const premadeCharacterFoldersResult = await BunnyStorageService.listFiles(premadeCharactersFolder);
      
      if (premadeCharacterFoldersResult.success && premadeCharacterFoldersResult.files) {
        // Extract character folder names from file paths
        const characterFolders = new Set<string>();
        for (const file of premadeCharacterFoldersResult.files) {
          const parts = file.split('/');
          if (parts.length > 0) {
            characterFolders.add(parts[0]);
          }
        }
        
        for (const characterName of characterFolders) {
          const imagesFolder = `${premadeCharactersFolder}/${characterName}/images`;
          
          try {
            const imagesResult = await BunnyStorageService.listFiles(imagesFolder);
            
            if (imagesResult.success && imagesResult.files && imagesResult.files.length > 0) {
              // Try to find the character in database
              let character = null;
              try {
                // For premade characters, search by name across all creators
                character = await CharacterModel.findOne({ 
                  name: { $regex: new RegExp(`^${characterName.replace(/-/g, ' ')}$`, 'i') }
                });
              } catch (error) {
                console.log(`Could not find premade character ${characterName} in database`);
              }

              const images = processImageFiles(imagesResult.files, imagesFolder, characterName, character);

              if (images.length > 0) {
                const groupKey = character?.id || characterName;
                
                // If we already have this character from created characters, merge the images
                if (characterGroups.has(groupKey)) {
                  const existingGroup = characterGroups.get(groupKey)!;
                  existingGroup.images = [...existingGroup.images, ...images];
                  existingGroup.totalImages += images.length;
                  // Sort by filename (which contains our index numbers)
                  existingGroup.images.sort((a, b) => b.url.localeCompare(a.url));
                } else {
                  // Create new group for this character
                  characterGroups.set(groupKey, {
                    characterId: character?.id || characterName,
                    characterName: character?.name || characterName.replace(/-/g, ' '),
                    characterAvatar: character?.avatar || character?.avatarUrl,
                    images: images,
                    totalImages: images.length,
                    isNsfw: character?.isNsfw || false
                  });
                }
              }
            }
          } catch (error) {
            console.log(`No images found in premade folder: ${imagesFolder}`);
          }
        }
      }
    } catch (error) {
      console.log(`No premade_characters folder found for user: ${username}`);
    }

    // Convert map to array and sort by total images (most images first)
    const characterGroupsArray = Array.from(characterGroups.values())
      .sort((a, b) => b.totalImages - a.totalImages);

    // Limit images per character to 12 for initial display
    const limitedGroups = characterGroupsArray.map(group => ({
      ...group,
      images: group.images.slice(0, 12) // Show only first 12 images per character
    }));

    console.log(`✅ Found ${characterGroupsArray.length} characters with images for user ${username}`);

    const responseData = {
      success: true,
      characterGroups: limitedGroups,
      totalCharacters: characterGroupsArray.length,
      totalImages: characterGroupsArray.reduce((total, group) => total + group.totalImages, 0)
    };

    // ===== CACHE STORAGE =====
    if (limitedGroups.length > 0) {
      cacheService.cacheUserImages(username, '*', limitedGroups)
        .then(() => console.log(`💾 Cached gallery with ${limitedGroups.length} character groups for ${username}`))
        .catch(error => console.warn('⚠️ Cache write error:', error));
    }

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching user gallery:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user gallery'
    });
  }
});

/**
 * Get all images for a specific character from user's gallery
 */
router.get('/:username/character/:characterId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { username, characterId } = req.params;
    const authUserId = req.user?.id;
    
    // Verify the user exists and the requesting user has permission
    const targetUser = await UserModel.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Users can only view their own gallery
    if (targetUser._id.toString() !== authUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get character info - handle both numeric ID and character name
    let character = null;
    
    // First try to find by numeric ID (if characterId is a number)
    if (/^\d+$/.test(characterId)) {
      character = await CharacterModel.findOne({ id: parseInt(characterId) });
    }
    
    // If not found by ID or characterId is not numeric, try to find by name
    if (!character) {
      character = await CharacterModel.findOne({ 
        name: { $regex: new RegExp(`^${characterId.replace(/[-]/g, ' ')}$`, 'i') }
      });
    }
    
    // If still not found, use characterId as the character name
    const characterName = character?.name || characterId;
    const sanitizedCharacterName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    console.log(`🖼️ Fetching all images for character ${characterName} from user ${username} gallery (Bunny CDN)`);

    const allImages: UserImage[] = [];

    // Check both character folders and premade character folders
    const foldersToCheck = [
      `${username}/characters/${sanitizedCharacterName}/images`,
      `${username}/premade_characters/${sanitizedCharacterName}/images`
    ];

    for (const imagesFolder of foldersToCheck) {
      try {
        const imagesResult = await BunnyStorageService.listFiles(imagesFolder);

        if (imagesResult.success && imagesResult.files && imagesResult.files.length > 0) {
          for (const filename of imagesResult.files) {
            // Skip index.txt and other non-image files
            if (!filename.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
              continue;
            }
            
            const imageUrl = BunnyStorageService.getPublicUrl(`${imagesFolder}/${filename}`);
            
            allImages.push({
              id: `${imagesFolder}/${filename}`,
              url: imageUrl,
              characterName: character?.name || characterName,
              characterId: characterId,
              characterAvatar: character?.avatar || character?.avatarUrl,
              createdAt: new Date().toISOString(), // We don't have creation date from Bunny
              isNsfw: character?.isNsfw || false
            });
          }
        }
      } catch (error) {
        console.log(`No images found in folder: ${imagesFolder}`);
      }
    }

    // Sort by filename (which contains our index numbers) - newest first
    allImages.sort((a, b) => b.url.localeCompare(a.url));

    console.log(`✅ Found ${allImages.length} images for character ${characterName}`);

    res.json({
      success: true,
      character: {
        id: characterId,
        name: character?.name || characterName,
        avatar: character?.avatar || character?.avatarUrl,
        isNsfw: character?.isNsfw || false
      },
      images: allImages,
      totalImages: allImages.length
    });

  } catch (error) {
    console.error('Error fetching character images from user gallery:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch character images'
    });
  }
});

/**
 * Public endpoint: Get all images generated by all users for premade characters
 * Looks in: username/premade_characters/characterName/images/filename
 * Note: This endpoint is currently disabled as listing all users from Bunny CDN is expensive.
 * Consider implementing a database-backed approach for better performance.
 */
router.get('/all', async (_req: Request, res: Response) => {
  try {
    console.log('🚫 Public gallery endpoint temporarily disabled - migrating to Bunny CDN');
    
    // For now, return empty array - this endpoint needs to be redesigned
    // to work efficiently with Bunny CDN or use a database to track images
    res.json({ 
      success: true, 
      images: [], 
      total: 0,
      message: 'Public gallery is being migrated to new storage system. Please check back later.'
    });
  } catch (error) {
    console.error('Error fetching all user images:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch images' });
  }
});

export default router;
