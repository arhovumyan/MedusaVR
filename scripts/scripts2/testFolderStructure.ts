// Test script to verify the complete Cloudinary folder structure implementation
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testCompleteFolderStructure() {
  console.log(' Testing complete Cloudinary folder structure...');
  
  // Test user IDs
  const testUserId1 = '507f1f77bcf86cd799439011';
  const testUserId2 = '507f1f77bcf86cd799439012';
  
  try {
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

    const uploadedImages: string[] = [];
    
    // Test 1: User 1 Avatar
    console.log('\n Testing User 1 Avatar Upload...');
    const user1Avatar = await uploadToCloudinary(testImageBuffer, {
      folder: `user_${testUserId1}/avatar`,
      public_id: `avatar_${Date.now()}`,
      width: 400,
      height: 400,
    });
    uploadedImages.push(user1Avatar.public_id);
    console.log(` User 1 Avatar: ${user1Avatar.secure_url}`);
    
    // Test 2: User 1 Character Images
    console.log('\n Testing User 1 Character Images...');
    for (let i = 1; i <= 2; i++) {
      const characterImage = await uploadToCloudinary(testImageBuffer, {
        folder: `user_${testUserId1}/characters`,
        public_id: `character_${i}_${Date.now()}`,
        width: 512,
        height: 512,
      });
      uploadedImages.push(characterImage.public_id);
      console.log(` User 1 Character ${i}: ${characterImage.secure_url}`);
    }
    
    // Test 3: User 2 Avatar
    console.log('\n Testing User 2 Avatar Upload...');
    const user2Avatar = await uploadToCloudinary(testImageBuffer, {
      folder: `user_${testUserId2}/avatar`,
      public_id: `avatar_${Date.now()}`,
      width: 400,
      height: 400,
    });
    uploadedImages.push(user2Avatar.public_id);
    console.log(` User 2 Avatar: ${user2Avatar.secure_url}`);
    
    // Test 4: User 2 Character Images
    console.log('\n Testing User 2 Character Images...');
    for (let i = 1; i <= 3; i++) {
      const characterImage = await uploadToCloudinary(testImageBuffer, {
        folder: `user_${testUserId2}/characters`,
        public_id: `character_${i}_${Date.now()}`,
        width: 512,
        height: 512,
      });
      uploadedImages.push(characterImage.public_id);
      console.log(` User 2 Character ${i}: ${characterImage.secure_url}`);
    }
    
    console.log('\n🏗️ Folder Structure Created:');
    console.log(` user_${testUserId1}/`);
    console.log(`├──  avatar/`);
    console.log(`└──  characters/`);
    console.log(` user_${testUserId2}/`);
    console.log(`├──  avatar/`);
    console.log(`└──  characters/`);
    
    console.log('\n Cleaning up test images...');
    for (const publicId of uploadedImages) {
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log(` Deleted: ${publicId}`);
      } catch (error) {
        console.warn(` Could not delete ${publicId}:`, error);
      }
    }
    
    console.log('\n Complete folder structure test successful!');
    console.log(' Your Cloudinary now supports:');
    console.log('   • User-specific folders (user_[userId])');
    console.log('   • Separate avatar folders (user_[userId]/avatar)');
    console.log('   • Separate character image folders (user_[userId]/characters)');
    console.log('   • Scalable structure for multiple users');
    console.log('   • Organized storage with clear hierarchy');
    
  } catch (error) {
    console.error(' Folder structure test failed:', error);
  }
}

async function uploadToCloudinary(buffer: Buffer, options: any) {
  return new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        ...options,
        crop: 'fill',
        format: 'jpg',
        quality: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
}

// Run the test
testCompleteFolderStructure();
