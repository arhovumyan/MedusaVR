import fetch from 'node-fetch';

async function testCharacterUpload() {
  try {
    console.log('Testing character image upload functionality...');
    
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

    // Test direct Bunny CDN upload for character images
    console.log('Testing direct Bunny CDN upload for character images...');
    
    const testUsername = 'testuser';
    const timestamp = Date.now();
    const fileName = `character_${timestamp}.jpg`;
    const filePath = `${testUsername}/characters/general/images/${fileName}`;
    
    const response = await fetch(`https://storage.bunnycdn.com/medusavr/${filePath}`, {
      method: 'PUT',
      headers: {
        'AccessKey': 'a2653876-2781-44bf-a09ce3b45f20-51d9-4063',
        'Content-Type': 'image/jpeg',
      },
      body: testImageBuffer
    });

    console.log('Upload response status:', response.status);
    console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const responseText = await response.text();
      console.log('Upload response body:', responseText);
      
      // Test the public URL
      const publicUrl = `https://medusavr.b-cdn.net/${filePath}`;
      console.log('Public URL:', publicUrl);
      
      // Test if the file is accessible
      const publicResponse = await fetch(publicUrl);
      console.log('Public access status:', publicResponse.status);
      
      if (publicResponse.ok) {
        console.log('✅ Character image upload test successful!');
        console.log('✅ File is accessible via public URL');
        console.log('✅ Folder structure: userName/characters/general/images/ is working');
      } else {
        console.log('❌ File not accessible via public URL');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Upload failed:', errorText);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testCharacterUpload();
