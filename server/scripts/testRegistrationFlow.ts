/**
 * Test the exact folder creation process that happens during registration
 */
async function testFolderCreation() {
  console.log('🧪 Testing folder creation process for user: aro');
  console.log('================================================');
  
  try {
    // Dynamic import like in the auth controller
    const { CloudinaryFolderService } = await import('../services/CloudinaryFolderService');
    
    console.log('1. Checking if Cloudinary is configured...');
    const isConfigured = CloudinaryFolderService.isConfigured();
    console.log(`   Configured: ${isConfigured}`);
    
    if (isConfigured) {
      console.log('2. Attempting to create folders...');
      const folderCreated = await CloudinaryFolderService.createUserFolders('aro');
      if (folderCreated) {
        console.log('✅ Successfully created Cloudinary folders for user aro');
      } else {
        console.warn('❌ Failed to create Cloudinary folders for user aro, but user registration completed');
      }
    } else {
      console.log('⚠️ Cloudinary not configured, skipping folder creation for user aro');
    }
    
  } catch (folderError) {
    console.error('Error creating Cloudinary folders for user aro:', folderError);
  }
  
  console.log('\n🎯 This should match what happened during registration');
}

// Run the test
testFolderCreation();
