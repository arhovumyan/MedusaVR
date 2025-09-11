import { Router, Request, Response } from 'express';
import { ImageIndexService } from '../services/ImageIndexService.js';
import { BunnyFolderService } from '../services/BunnyFolderService.js';

const router = Router();

/**
 * Test endpoint to verify the image indexing system
 * GET /api/test-image-index/check-structure/:username/:characterName
 */
router.get('/check-structure/:username/:characterName', async (req: Request, res: Response) => {
  try {
    const { username, characterName } = req.params;
    
    console.log(`🧪 Testing folder structure for: ${username}/${characterName}`);
    
    // Ensure the folder structure exists
    const folderCreated = await ImageIndexService.ensurePremadeCharacterFolderStructure(username, characterName);
    
    // Get current image count
    const currentCount = await ImageIndexService.getCurrentImageCount(username, characterName);
    
    // Get next image number (this will increment the index)
    const nextNumber = await ImageIndexService.getNextImageNumber(username, characterName);
    
    // Generate filename example
    const exampleFilename = ImageIndexService.generateImageFilename(username, characterName, nextNumber);
    
    res.json({
      success: true,
      data: {
        username,
        characterName,
        folderCreated,
        currentCount,
        nextNumber,
        exampleFilename,
        folderPath: `${username}/premade_characters/${characterName.toLowerCase().replace(/[^a-z0-9]/g, '-')}/images`,
        indexFilePath: `${username}/premade_characters/${characterName.toLowerCase().replace(/[^a-z0-9]/g, '-')}/images/index.txt`
      }
    });
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test endpoint to simulate image upload with indexing
 * POST /api/test-image-index/simulate-upload
 */
router.post('/simulate-upload', async (req: Request, res: Response) => {
  try {
    const { username, characterName } = req.body;
    
    if (!username || !characterName) {
      return res.status(400).json({
        success: false,
        error: 'Username and characterName are required'
      });
    }
    
    console.log(`🧪 Simulating image upload for: ${username}/${characterName}`);
    
    // Create a dummy image buffer (1x1 PNG)
    const dummyImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    // Upload using the new indexed system
    const uploadResult = await BunnyFolderService.uploadPremadeCharacterImageWithIndexing(
      username,
      characterName,
      dummyImageBuffer
    );
    
    res.json({
      success: true,
      message: 'Simulated upload completed',
      data: {
        uploadResult,
        username,
        characterName
      }
    });
    
  } catch (error) {
    console.error('❌ Simulate upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test endpoint to reset image index for a character
 * POST /api/test-image-index/reset-index
 */
router.post('/reset-index', async (req: Request, res: Response) => {
  try {
    const { username, characterName } = req.body;
    
    if (!username || !characterName) {
      return res.status(400).json({
        success: false,
        error: 'Username and characterName are required'
      });
    }
    
    console.log(`🧪 Resetting index for: ${username}/${characterName}`);
    
    const resetResult = await ImageIndexService.resetImageIndex(username, characterName);
    
    res.json({
      success: true,
      message: 'Index reset completed',
      data: {
        resetResult,
        username,
        characterName
      }
    });
    
  } catch (error) {
    console.error('❌ Reset index error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test endpoint to get current statistics for a character
 * GET /api/test-image-index/stats/:username/:characterName
 */
router.get('/stats/:username/:characterName', async (req: Request, res: Response) => {
  try {
    const { username, characterName } = req.params;
    
    console.log(`🧪 Getting stats for: ${username}/${characterName}`);
    
    const currentCount = await ImageIndexService.getCurrentImageCount(username, characterName);
    const sanitizedCharacterName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    res.json({
      success: true,
      data: {
        username,
        characterName,
        sanitizedCharacterName,
        currentImageCount: currentCount,
        nextImageNumber: currentCount + 1,
        expectedNextFilename: ImageIndexService.generateImageFilename(username, characterName, currentCount + 1),
        folderPath: `${username}/premade_characters/${sanitizedCharacterName}/images`,
        indexFilePath: `${username}/premade_characters/${sanitizedCharacterName}/images/index.txt`
      }
    });
    
  } catch (error) {
    console.error('❌ Stats endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
