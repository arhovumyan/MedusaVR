import { ImageModerationService } from '../services/ImageModerationService.js';

/**
 * Test script for Image Moderation Service
 * Tests various prompts to ensure content filtering works correctly
 */

interface TestCase {
  prompt: string;
  expectedResult: 'clean' | 'minor_content' | 'animal_content';
  description: string;
}

const testCases: TestCase[] = [
  // Clean prompts (should pass)
  {
    prompt: "beautiful woman with long hair, elegant dress, professional photo",
    expectedResult: 'clean',
    description: "Clean adult portrait prompt"
  },
  {
    prompt: "handsome man in a suit, corporate headshot, high quality",
    expectedResult: 'clean',
    description: "Clean adult male prompt"
  },
  {
    prompt: "fantasy warrior woman, armor, sword, detailed art",
    expectedResult: 'clean',
    description: "Clean fantasy adult character"
  },

  // Minor content (should be blocked)
  {
    prompt: "17 year old girl in a school uniform",
    expectedResult: 'minor_content',
    description: "Direct age reference under 18"
  },
  {
    prompt: "teenager in high school classroom",
    expectedResult: 'minor_content',
    description: "School context suggesting minor"
  },
  {
    prompt: "young schoolgirl with pigtails",
    expectedResult: 'minor_content',
    description: "Minor-related descriptors"
  },
  {
    prompt: "loli character with cute face",
    expectedResult: 'minor_content',
    description: "Explicit loli reference"
  },
  {
    prompt: "sixteen year old model posing",
    expectedResult: 'minor_content',
    description: "Spelled out age under 18"
  },
  {
    prompt: "innocent young girl, barely legal but looks 16",
    expectedResult: 'minor_content',
    description: "Age manipulation attempt"
  },

  // Animal content (should be blocked)
  {
    prompt: "sexy cat girl with animal ears and tail",
    expectedResult: 'animal_content',
    description: "Furry/animal content"
  },
  {
    prompt: "woman with dog in intimate scene",
    expectedResult: 'animal_content',
    description: "Human-animal inappropriate context"
  },
  {
    prompt: "anthropomorphic fox character, sexy pose",
    expectedResult: 'animal_content',
    description: "Anthropomorphic animal"
  },
  {
    prompt: "horse girl transformation, sexual",
    expectedResult: 'animal_content',
    description: "Animal transformation sexual content"
  },
  {
    prompt: "centaur in erotic pose",
    expectedResult: 'animal_content',
    description: "Mythical animal-human hybrid"
  },
  {
    prompt: "furry wolf character, nude art",
    expectedResult: 'animal_content',
    description: "Furry sexual content"
  }
];

function runTests() {
  console.log(' Starting Image Moderation Service Tests\n');
  
  let passedTests = 0;
  let failedTests = 0;
  const failedTestDetails: string[] = [];

  testCases.forEach((testCase, index) => {
    const result = ImageModerationService.moderateImagePrompt(testCase.prompt);
    
    const passed = result.violationType === testCase.expectedResult;
    
    if (passed) {
      console.log(` Test ${index + 1}: ${testCase.description}`);
      passedTests++;
    } else {
      console.log(` Test ${index + 1}: ${testCase.description}`);
      console.log(`   Expected: ${testCase.expectedResult}, Got: ${result.violationType}`);
      console.log(`   Prompt: "${testCase.prompt}"`);
      if (result.detectedPatterns && result.detectedPatterns.length > 0) {
        console.log(`   Detected patterns: ${result.detectedPatterns.join(', ')}`);
      }
      console.log('');
      
      failedTests++;
      failedTestDetails.push(`Test ${index + 1}: Expected ${testCase.expectedResult}, got ${result.violationType}`);
    }
  });

  console.log('\n Test Results Summary:');
  console.log(` Passed: ${passedTests}/${testCases.length}`);
  console.log(` Failed: ${failedTests}/${testCases.length}`);
  
  if (failedTests > 0) {
    console.log('\n Failed Test Details:');
    failedTestDetails.forEach(detail => console.log(`   ${detail}`));
  }

  // Test negative prompt enhancement
  console.log('\n Testing Negative Prompt Enhancement:');
  
  const testNegativePrompts = [
    '',
    'low quality, blurry',
    'bad anatomy, ugly face',
    'low quality, child, minor, teen' // already has safety terms
  ];

  testNegativePrompts.forEach((prompt, index) => {
    const enhanced = ImageModerationService.enhanceNegativePrompt(prompt);
    console.log(`\nNegative Prompt Test ${index + 1}:`);
    console.log(`Input: "${prompt}"`);
    console.log(`Enhanced: "${enhanced}"`);
  });

  console.log('\n Test completed!');
  
  if (failedTests === 0) {
    console.log(' All tests passed! Image moderation system is working correctly.');
  } else {
    console.log('  Some tests failed. Please review the patterns and adjust if needed.');
  }

  return failedTests === 0;
}

// Run the tests
if (import.meta.main) {
  runTests();
}

export { runTests, testCases };
