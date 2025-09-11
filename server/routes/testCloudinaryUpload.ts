/**
 * Test route for verifying Cloudinary upload fix
 * This bypasses authentication to test the core functionality
 */

import express from 'express';
import asyncImageGenerationService from '../services/AsyncImageGenerationService.js';
import { CharacterModel } from '../db/models/CharacterModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CloudinaryFolderService } from '../services/CloudinaryFolderService.js';

const router = express.Router();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test endpoint to upload actual tester.png file to Cloudinary
router.post('/upload-tester-png', async (req, res) => {
  try {
    console.log('🧪 Testing direct upload of tester.png to Cloudinary');
    
    // Path to tester.png (go up from server/routes to main folder)
    const testerPngPath = path.join(__dirname, '../../tester.png');
    
    // Check if file exists
    if (!fs.existsSync(testerPngPath)) {
      return res.status(404).json({
        error: 'tester.png not found',
        path: testerPngPath,
        success: false
      });
    }

    // Test user ID
    const TEST_USER_ID = '687ae2d140ab274fc58e4b25'; // testuser1752883921407
    
    // Get a character for testing
    const testCharacter = await CharacterModel.findOne({ 
      creatorId: { $ne: TEST_USER_ID } 
    }).limit(1);
    
    if (!testCharacter) {
      return res.status(404).json({ 
        error: 'No characters found for testing',
        success: false 
      });
    }

    console.log(`📋 Testing upload with character: ${testCharacter.name} (ID: ${testCharacter._id})`);
    console.log(`📁 Tester file path: ${testerPngPath}`);

    // Read the file
    const imageBuffer = fs.readFileSync(testerPngPath);
    console.log(`📊 File size: ${imageBuffer.length} bytes`);

    // Determine if this should go to premade_characters folder
    const isExistingCharacter = testCharacter.creatorId?.toString() !== TEST_USER_ID;
    const expectedFolder = isExistingCharacter ? 'premade_characters' : 'characters';
    
    console.log(`📂 Expected folder: ${expectedFolder}`);
    console.log(`👤 Is existing character: ${isExistingCharacter}`);

    // Convert buffer to base64 string for Cloudinary upload
    const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    // Upload the image
    let uploadResult;
    if (isExistingCharacter) {
      uploadResult = await CloudinaryFolderService.uploadToPremadeCharacterFolder(
        imageBase64,
        TEST_USER_ID,
        testCharacter.name,
        'tester_upload_test'
      );
    } else {
      uploadResult = await CloudinaryFolderService.uploadToCharacterFolder(
        imageBase64,
        TEST_USER_ID,
        testCharacter.name,
        'tester_upload_test'
      );
    }

    console.log('✅ Upload successful:', uploadResult);

    return res.json({
      success: true,
      message: 'tester.png uploaded successfully to Cloudinary',
      uploadResult,
      testDetails: {
        characterId: testCharacter._id,
        characterName: testCharacter.name,
        testUser: TEST_USER_ID,
        isExistingCharacter,
        expectedFolder,
        fileSize: imageBuffer.length,
        filePath: testerPngPath
      },
      folderAnalysis: {
        hasCloudinaryUrl: !!uploadResult.secure_url,
        inPremadeFolder: uploadResult.secure_url?.includes('/premade_characters/'),
        inCharactersFolder: uploadResult.secure_url?.includes('/characters/'),
        fullUrl: uploadResult.secure_url
      }
    });

  } catch (error) {
    console.error('❌ Test upload failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Upload test failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Test endpoint to generate image from RunPod and upload to Cloudinary with specific naming
router.post('/runpod-to-cloudinary-test', async (req, res) => {
  try {
    console.log('🧪 Testing RunPod image generation + Cloudinary upload with specific naming');
    
    // Use the exact same test user and character from the successful test
    const TEST_USER_ID = '687ae2d140ab274fc58e4b25'; // testuser1752883921407
    
    // Find Isla Umber character specifically (or similar character)
    const testCharacter = await CharacterModel.findOne({ 
      name: { $regex: /isla.*umber/i }
    }) || await CharacterModel.findOne({ 
      creatorId: { $ne: TEST_USER_ID } 
    }).limit(1);
    
    if (!testCharacter) {
      return res.status(404).json({ 
        error: 'No test character found',
        success: false 
      });
    }

    console.log(`📋 Testing with character: ${testCharacter.name} (ID: ${testCharacter._id})`);
    console.log(`   Created by: ${testCharacter.creatorId}`);

    // Create test image generation request (similar to the successful test)
    const testRequest = {
      prompt: `${testCharacter.name}, portrait, masterpiece, best quality, detailed face, beautiful lighting, fantasy character`,
      negativePrompt: 'blurry, low quality, distorted, bad anatomy, deformed',
      characterId: testCharacter._id.toString(),
      characterName: testCharacter.name,
      characterPersona: testCharacter.description || 'A mystical fantasy character',
      width: 512,
      height: 768,
      steps: 20,
      cfgScale: 7,
      quantity: 1,
      artStyle: 'realistic',
      // Add specific naming to match the successful test
      imagePrefix: 'runpod_test'
    };

    console.log('🚀 Starting RunPod image generation for Cloudinary test...');
    console.log(`🎯 Target folder structure: testuser1752883921407/premade_characters/${testCharacter.name.toLowerCase().replace(/\s+/g, '-')}/images/`);
    
    // Start the generation using the async service
    const jobId = await asyncImageGenerationService.startGeneration(TEST_USER_ID, testRequest);
    
    console.log(`📝 RunPod generation job started: ${jobId}`);
    console.log(`🔍 Expected filename pattern: testuser1752883921407_${testCharacter.name.toLowerCase().replace(/\s+/g, '-')}_runpod_test_1.png`);

    res.json({
      success: true,
      message: 'RunPod image generation started - will upload to Cloudinary upon completion',
      jobId: jobId,
      testCharacter: {
        id: testCharacter._id,
        name: testCharacter.name,
        normalizedName: testCharacter.name.toLowerCase().replace(/\s+/g, '-'),
        createdBy: testCharacter.creatorId
      },
      testUser: TEST_USER_ID,
      testUsername: 'testuser1752883921407',
      isExistingCharacter: testCharacter.creatorId?.toString() !== TEST_USER_ID,
      expectedFolder: 'premade_characters',
      expectedPath: `testuser1752883921407/premade_characters/${testCharacter.name.toLowerCase().replace(/\s+/g, '-')}/images/`,
      expectedFilename: `testuser1752883921407_${testCharacter.name.toLowerCase().replace(/\s+/g, '-')}_runpod_test_1.png`,
      note: 'Monitor using /api/test-cloudinary/test-job-status/{jobId} to see RunPod generation + Cloudinary upload results'
    });

  } catch (error) {
    console.error('❌ RunPod to Cloudinary test error:', error);
    res.status(500).json({ 
      error: error.message, 
      success: false 
    });
  }
});

// Test endpoint to verify Cloudinary upload fix
router.post('/test-cloudinary-upload', async (req, res) => {
  try {
    console.log('🧪 Test endpoint called - testing Cloudinary upload fix');
    
    // Test user ID (the one provided by user)
    const TEST_USER_ID = '687ae2d140ab274fc58e4b25'; // testuser1752883921407
    
    // Get a character for testing (not created by this user)
    const testCharacter = await CharacterModel.findOne({ 
      creatorId: { $ne: TEST_USER_ID } 
    }).limit(1);
    
    if (!testCharacter) {
      return res.status(404).json({ 
        error: 'No characters found for testing',
        success: false 
      });
    }

    console.log(`📋 Testing with character: ${testCharacter.name} (ID: ${testCharacter._id})`);
    console.log(`   Created by: ${testCharacter.creatorId}`);
    console.log(`   User ${TEST_USER_ID} is generating from existing character: ${testCharacter.creatorId?.toString() !== TEST_USER_ID}`);

    // Create test image generation request
    const testRequest = {
      prompt: `${testCharacter.name}, portrait, masterpiece, best quality, detailed face, beautiful lighting`,
      negativePrompt: 'blurry, low quality, distorted, bad anatomy',
      characterId: testCharacter._id.toString(),
      characterName: testCharacter.name,
      characterPersona: testCharacter.description || 'A character for testing',
      width: 512,
      height: 768,
      steps: 20,
      cfgScale: 7,
      quantity: 1,
      artStyle: 'realistic'
    };

    console.log('🚀 Starting test image generation...');
    
    // Start the generation
    const jobId = await asyncImageGenerationService.startGeneration(TEST_USER_ID, testRequest);
    
    console.log(`📝 Test job started: ${jobId}`);

    res.json({
      success: true,
      message: 'Test image generation started',
      jobId: jobId,
      testCharacter: {
        id: testCharacter._id,
        name: testCharacter.name,
        createdBy: testCharacter.creatorId
      },
      testUser: TEST_USER_ID,
      isExistingCharacter: testCharacter.creatorId?.toString() !== TEST_USER_ID,
      expectedFolder: 'premade_characters', // Since user is not the character creator
      note: 'Monitor the job using /api/image-generation/status/{jobId} to see if images upload to Cloudinary correctly'
    });

  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({ 
      error: error.message, 
      success: false 
    });
  }
});

// Test endpoint to get job status (no auth required for testing)
router.get('/test-job-status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = asyncImageGenerationService.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found', 
        success: false 
      });
    }

    console.log(`📊 Test job ${jobId}: ${job.status} (${job.progress}%)`);

    let folderAnalysis = null;
    if (job.status === 'completed' && job.result?.imageUrl) {
      const imageUrl = job.result.imageUrl;
      folderAnalysis = {
        hasCloudinaryUrl: imageUrl.includes('cloudinary.com'),
        inPremadeFolder: imageUrl.includes('/premade_characters/'),
        inCharactersFolder: imageUrl.includes('/characters/'),
        fullUrl: imageUrl
      };
      
      if (folderAnalysis.hasCloudinaryUrl) {
        if (folderAnalysis.inPremadeFolder) {
          console.log('✅ SUCCESS: Image correctly uploaded to premade_characters folder');
        } else if (folderAnalysis.inCharactersFolder) {
          console.log('⚠️  ISSUE: Image uploaded to characters folder instead of premade_characters');
        } else {
          console.log('⚠️  UNKNOWN: Image uploaded to unknown folder structure');
        }
      } else {
        console.log('❌ ISSUE: Image not uploaded to Cloudinary');
      }
    }

    res.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        error: job.error,
        result: job.result,
        estimatedTimeRemaining: job.estimatedTimeRemaining
      },
      folderAnalysis
    });

  } catch (error) {
    console.error('❌ Test status endpoint error:', error);
    res.status(500).json({ 
      error: error.message, 
      success: false 
    });
  }
});

export default router;
