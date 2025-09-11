#!/usr/bin/env tsx

/**
 * Test Character Creation API Integration
 * 
 * This script tests the create-character route with our new FastCharacterGenerationService
 */

import fetch from 'node-fetch';

interface TestCharacterData {
  name: string;
  description: string;
  personalityTraits: {
    mainTrait: string;
    subTraits: string[];
  };
  artStyle: {
    primaryStyle: string;
  };
  selectedTags: {
    [key: string]: string[];
  };
}

async function testCharacterCreation() {
  console.log('🧪 Testing Character Creation API Integration');
  
  const testCharacter: TestCharacterData = {
    name: "Zara Techweaver",
    description: "A brilliant cyberpunk engineer who builds advanced AI companions and neural interfaces in the neon-lit streets of Neo-Tokyo.",
    personalityTraits: {
      mainTrait: "innovative",
      subTraits: ["tech-savvy", "rebellious", "determined"]
    },
    artStyle: {
      primaryStyle: "anime"
    },
    selectedTags: {
      "character-type": ["female"],
      "genre": ["sci-fi", "cyberpunk"],
      "personality": ["innovative", "tech-savvy"],
      "appearance": ["colorful-hair", "cybernetic-implants"],
      "origin": ["human"],
      "content-rating": ["sfw"]
    }
  };

  try {
    console.log('📤 Sending character creation request...');
    console.log('📋 Character data:', JSON.stringify(testCharacter, null, 2));

    const response = await fetch('http://localhost:3001/api/characters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you would need proper authentication headers
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN'
      },
      body: JSON.stringify(testCharacter)
    });

    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Character creation failed:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Character created successfully!');
    console.log('📊 Result:', {
      id: result.id,
      name: result.name,
      avatar: result.avatar,
      hasEmbeddings: !!result.embeddings,
      imageGeneration: !!result.imageGeneration
    });

    return result;

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testImageGeneration(characterId: string) {
  console.log('\n🎨 Testing Character Image Generation API');
  
  try {
    const response = await fetch(`http://localhost:3001/api/characters/${characterId}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you would need proper authentication headers
      },
      body: JSON.stringify({
        imageType: 'portrait',
        mood: 'confident',
        setting: 'futuristic laboratory'
      })
    });

    console.log('📥 Image generation response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Image generation failed:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Additional image generated successfully!');
    console.log('🔗 Image URL:', result.imageUrl);
    console.log('⏱️ Generation time:', result.generationTime + 's');

  } catch (error) {
    console.error('❌ Image generation test failed:', error);
  }
}

async function main() {
  console.log('🚀 Starting Character Creation API Tests\n');
  
  // Test 1: Character Creation
  const character = await testCharacterCreation();
  
  if (character?.id) {
    // Test 2: Additional Image Generation
    await testImageGeneration(character.id);
  }

  console.log('\n🎉 Tests completed!');
  console.log('\n📚 Notes:');
  console.log('- Make sure your server is running on http://localhost:3001');
  console.log('- Authentication is disabled for this test');
  console.log('- Check your Cloudinary dashboard for uploaded images');
  console.log('- Check your MongoDB for the created character');
}

if (require.main === module) {
  main().catch(console.error);
}

export { testCharacterCreation, testImageGeneration };
