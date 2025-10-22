// Test script to verify Cloudinary upload works and creates user_avatar folder
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testCloudinaryUpload() {
  try {
    console.log(' Testing Cloudinary upload...');
    
    // Create a simple test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 
      0x89, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x78, 0xDA, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
      0x42, 0x60, 0x82
    ]);

    // Upload to Cloudinary using buffer (same as the upload controller)
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'user_avatar', // This will create the folder
          width: 400,
          height: 400,
          crop: 'fill',
          format: 'jpg',
          quality: 'auto',
          public_id: `test_upload_${Date.now()}`, // Test filename
        },
        (error, result) => {
          if (error) {
            console.error(' Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(testImageBuffer);
    });

    const cloudinaryResult = uploadResult as any;
    
    console.log(' Upload successful!');
    console.log(' Folder created: user_avatar');
    console.log(' Image URL:', cloudinaryResult.secure_url);
    console.log('🆔 Public ID:', cloudinaryResult.public_id);
    
    // Cleanup - delete the test image
    try {
      await cloudinary.uploader.destroy(cloudinaryResult.public_id);
      console.log(' Test image cleaned up');
    } catch (cleanupError) {
      console.warn(' Could not cleanup test image:', cleanupError);
    }
    
    console.log(' Cloudinary setup is working correctly!');
    console.log('📂 The user_avatar folder is now available in your Cloudinary account');
    
  } catch (error) {
    console.error(' Cloudinary test failed:', error);
    console.log('\n Please check:');
    console.log('1. CLOUDINARY_CLOUD_NAME is set correctly');
    console.log('2. CLOUDINARY_API_KEY is set correctly');
    console.log('3. CLOUDINARY_API_SECRET is set correctly');
    console.log('4. Your Cloudinary account is active');
  }
}

// Run the test
testCloudinaryUpload();
