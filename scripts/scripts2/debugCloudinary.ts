import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Debug script to check Cloudinary environment variables
 */
function debugCloudinaryConfig() {
  console.log(' Debugging Cloudinary Configuration:');
  console.log('=====================================');
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  console.log(`CLOUDINARY_CLOUD_NAME: ${cloudName ? ' SET' : ' NOT SET'}`);
  if (cloudName) console.log(`  Value: ${cloudName}`);
  
  console.log(`CLOUDINARY_API_KEY: ${apiKey ? ' SET' : ' NOT SET'}`);
  if (apiKey) console.log(`  Value: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
  
  console.log(`CLOUDINARY_API_SECRET: ${apiSecret ? ' SET' : ' NOT SET'}`);
  if (apiSecret) console.log(`  Value: ${apiSecret.substring(0, 4)}...${apiSecret.substring(apiSecret.length - 4)}`);
  
  console.log('\n Configuration Status:');
  const isConfigured = !!(cloudName && apiKey && apiSecret);
  console.log(`Overall configured: ${isConfigured ? ' YES' : ' NO'}`);
  
  if (!isConfigured) {
    console.log('\n To configure Cloudinary, set these environment variables:');
    console.log('   export CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('   export CLOUDINARY_API_KEY=your_api_key');
    console.log('   export CLOUDINARY_API_SECRET=your_api_secret');
    console.log('\n   Or create a .env file in the project root with:');
    console.log('   CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('   CLOUDINARY_API_KEY=your_api_key');
    console.log('   CLOUDINARY_API_SECRET=your_api_secret');
  }
}

// Run the debug
debugCloudinaryConfig();
