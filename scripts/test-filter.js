// Test prohibited words filtering
import { checkProhibitedWords } from '../src/lib/prohibitedWordsFilter.js';

// Test words that should be blocked
const testWords = [
  'child',
  'dog',
  'animal', 
  'zebra',
  'blood'
];

console.log('Testing prohibited words filter:');
testWords.forEach(word => {
  const result = checkProhibitedWords(word);
  console.log(`Word: "${word}" - Blocked: ${!result.isAllowed} - Violations: ${result.violations.join(', ')}`);
});

// Test combinations
const testPhrases = [
  'dog, animal, zebra, child',
  'a cute dog',
  'beautiful zebra',
  'playing with animals'
];

console.log('\nTesting phrases:');
testPhrases.forEach(phrase => {
  const result = checkProhibitedWords(phrase);
  console.log(`Phrase: "${phrase}" - Blocked: ${!result.isAllowed} - Violations: ${result.violations.join(', ')}`);
});
