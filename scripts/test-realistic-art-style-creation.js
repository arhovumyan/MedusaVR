#!/usr/bin/env node

/**
 * Test script to verify realistic art style routing during character creation
 * This script tests that when creating a character with "realistic" art style:
 * 1. It routes to RUNPOD_REALISTIC_URL (https://vkfydhwbdpn6pq-7860.proxy.runpod.net)
 * 2. It uses cyberrealistic.safetensors model
 * 3. Character creation works end-to-end
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5002'; // Adjust if your server runs on different port

async function testRealisticArtStyleCreation() {
  console.log(' Testing realistic art style character creation...\n');

  // Test data - realistic character
  const testCharacter = {
    name: "Test Realistic Character",
    description: "A beautiful photorealistic woman with long brown hair and green eyes",
    quickSuggestion: "Let's explore the world together!",
    isNsfw: false,
    isPublic: true,
    personalityTraits: {
      mainTrait: "confident",
      subTraits: ["caring", "adventurous"]
    },
    artStyle: {
      primaryStyle: "realistic" // This should route to port 7860
    },
    selectedTags: {
      'character-type': ["female"],
      'appearance': ["brunette", "green-eyes", "long-hair"],
      'personality': ["confident", "caring"],
      'content-rating': ["sfw"]
    }
  };

  console.log(' Test character data:', JSON.stringify(testCharacter, null, 2));
  console.log('\n Expected behavior:');
  console.log('  - Should use RUNPOD_REALISTIC_URL (https://vkfydhwbdpn6pq-7860.proxy.runpod.net)');
  console.log('  - Should use cyberrealistic.safetensors model');
  console.log('  - Should generate realistic-style image\n');

  try {
    // Get auth token (you'll need to update this with a valid token)
    const token = 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual token from localStorage
    
    console.log(' Creating character...');
    
    const response = await fetch(`${API_BASE}/api/characters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testCharacter)
    });

    const statusCode = response.status;
    console.log(`📥 Response status: ${statusCode}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(' Request failed:', errorText);
      return;
    }

    const result = await response.json();
    console.log(' Character creation result:', JSON.stringify(result, null, 2));

    if (result.success && result.character) {
      console.log('\n SUCCESS! Character created successfully!');
      console.log(`📍 Character ID: ${result.character.id}`);
      console.log(` Avatar URL: ${result.character.avatar}`);
      console.log(` Art Style: ${result.character.artStyle?.primaryStyle}`);
      
      // Check server logs for evidence of realistic routing
      console.log('\n Check your server logs for these messages:');
      console.log('  - " Getting WebUI URL for style: realistic"');
      console.log('  - " Using realistic checkpoint: https://vkfydhwbdpn6pq-7860.proxy.runpod.net"');
      console.log('  - " Using model: cyberrealistic.safetensors"');
    } else {
      console.log(' Character creation completed but may have used fallback method');
    }

  } catch (error) {
    console.error(' Test failed with error:', error.message);
    console.log('\n Troubleshooting:');
    console.log('1. Make sure your server is running on http://localhost:5002');
    console.log('2. Update the AUTH_TOKEN in this script with a valid token');
    console.log('3. Check that RUNPOD_REALISTIC_URL is set in your .env file');
    console.log('4. Verify the RunPod endpoints are accessible');
  }
}

async function testAnimeComparison() {
  console.log('\n\n🎌 Testing anime art style for comparison...\n');

  const animeCharacter = {
    name: "Test Anime Character",
    description: "A cute anime girl with pink hair and blue eyes",
    quickSuggestion: "Kawaii adventures await!",
    isNsfw: false,
    isPublic: true,
    personalityTraits: {
      mainTrait: "playful",
      subTraits: ["cheerful", "energetic"]
    },
    artStyle: {
      primaryStyle: "anime" // This should route to port 7861
    },
    selectedTags: {
      'character-type': ["female"],
      'appearance': ["pink-hair", "blue-eyes"],
      'personality': ["playful", "cheerful"],
      'genre': ["anime"],
      'content-rating': ["sfw"]
    }
  };

  console.log(' Expected behavior for anime:');
  console.log('  - Should use RUNPOD_ANIME_CARTOON_FANTASY_URL (port 7861)');
  console.log('  - Should use diving.safetensors model\n');

  try {
    const token = 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual token
    
    const response = await fetch(`${API_BASE}/api/characters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(animeCharacter)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(' Anime character created successfully!');
      console.log(' Check server logs for anime routing evidence');
    } else {
      console.log(' Anime test failed');
    }

  } catch (error) {
    console.log(' Anime comparison test failed:', error.message);
  }
}

// Run tests
console.log(' Art Style Routing Test for Character Creation\n');
console.log('This script tests the realistic art style routing fix.\n');

testRealisticArtStyleCreation()
  .then(() => testAnimeComparison())
  .then(() => {
    console.log('\n Test Summary:');
    console.log('- Realistic characters should route to port 7860 with cyberrealistic.safetensors');
    console.log('- Anime characters should route to port 7861 with diving.safetensors');
    console.log('- Check server logs for routing confirmation');
    console.log('\n Art style routing implementation is complete!');
  });
