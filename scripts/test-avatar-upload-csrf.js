import fetch from 'node-fetch';
import FormData from 'form-data';

async function testAvatarUploadWithCsrf() {
  try {
    console.log('Testing avatar upload with CSRF protection...');
    
    // First, get a CSRF token
    console.log('1. Fetching CSRF token...');
    const csrfResponse = await fetch('http://localhost:5002/api/csrf-token', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!csrfResponse.ok) {
      console.error('❌ Failed to get CSRF token:', csrfResponse.status);
      return;
    }

    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;
    console.log('✅ CSRF token obtained:', csrfToken ? 'Yes' : 'No');

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

    // Create form data with the test image
    const formData = new FormData();
    formData.append('avatar', testImageBuffer, {
      filename: 'test-avatar.png',
      contentType: 'image/png'
    });

    // Add CSRF token to form data
    formData.append('_csrf', csrfToken);

    console.log('2. Testing avatar upload with CSRF token...');
    
    // Test the avatar upload endpoint
    const uploadResponse = await fetch('http://localhost:5002/api/upload/avatar', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
      body: formData,
      credentials: 'include',
    });

    console.log('Upload response status:', uploadResponse.status);
    console.log('Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));
    
    if (uploadResponse.ok) {
      const responseData = await uploadResponse.json();
      console.log('✅ Avatar upload successful!');
      console.log('Response data:', responseData);
      
      if (responseData.url) {
        console.log('✅ Avatar URL:', responseData.url);
        
        // Test if the uploaded file is accessible
        const publicResponse = await fetch(responseData.url);
        console.log('Public access status:', publicResponse.status);
        
        if (publicResponse.ok) {
          console.log('✅ Avatar is accessible via public URL');
        } else {
          console.log('❌ Avatar not accessible via public URL');
        }
      }
    } else {
      const errorText = await uploadResponse.text();
      console.log('❌ Upload failed:', errorText);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testAvatarUploadWithCsrf();




