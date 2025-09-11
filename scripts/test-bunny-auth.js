console.log('Testing Bunny CDN connection...');
console.log('Access Key:', process.env.BUNNY_ACCESS_KEY);
console.log('Storage Host:', process.env.BUNNY_STORAGE_API_HOST);

import fetch from 'node-fetch';

async function testBunnyAuth() {
  try {
    const testPath = 'test-auth-file.txt';
    const testData = Buffer.from('test', 'utf-8');
    
    console.log('Testing upload with current credentials...');
    
    const response = await fetch(`${process.env.BUNNY_STORAGE_API_HOST}/medusavr/${testPath}`, {
      method: 'PUT',
      headers: {
        'AccessKey': process.env.BUNNY_ACCESS_KEY,
        'Content-Type': 'text/plain',
      },
      body: testData
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);

  } catch (error) {
    console.error('Test error:', error);
  }
}

testBunnyAuth();
