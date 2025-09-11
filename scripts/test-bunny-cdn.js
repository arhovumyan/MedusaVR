const { BunnyStorageService } = require('../server/dist/services/BunnyStorageService.js');
const { BunnyFolderService } = require('../server/dist/services/BunnyFolderService.js');

async function testBunnyCDN() {
  try {
    console.log('🧪 Testing Bunny CDN configuration...');
    
    // Test uploading a simple text file
    const testData = Buffer.from('Hello from Bunny CDN test!', 'utf-8');
    const testPath = 'test-user/test-folder/test-file.txt';
    
    console.log('📤 Uploading test file...');
    const uploadResult = await BunnyStorageService.uploadFile(testPath, testData, 'text/plain');
    
    if (uploadResult.success) {
      console.log('✅ Upload successful:', uploadResult.url);
      
      // Test listing files
      console.log('📋 Testing file listing...');
      const listResult = await BunnyStorageService.listFiles('test-user/test-folder');
      console.log('📋 List result:', listResult);
      
      // Test deletion
      console.log('🗑️ Testing file deletion...');
      const deleteResult = await BunnyStorageService.deleteFile(testPath);
      console.log('🗑️ Delete result:', deleteResult);
      
    } else {
      console.error('❌ Upload failed:', uploadResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBunnyCDN();
