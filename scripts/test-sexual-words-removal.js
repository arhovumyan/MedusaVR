const { checkProhibitedWords } = require('../client/src/lib/prohibitedWordsFilter.ts');

console.log('Testing sexual words filter after removing consensual adult content...');

// Test cases
const testCases = [
  // Should be ALLOWED now (consensual adult content)
  'sex',
  'sexual',
  'adult',
  'consensual sex',
  'intimate',
  'erotic',
  'nude',
  'naked',
  
  // Should still be BLOCKED (harmful content)
  'rape',
  'child',
  'minor',
  'animal sex',
  'forced sex',
  'non-consensual',
  'underage',
  'bestiality',
  'incest',
  'kill',
  'murder',
  'torture',
  
  // Edge case - should be allowed now
  'prostitution' // This should now be allowed as it's consensual adult work
];

console.log('Results:');
console.log('=======');

testCases.forEach(testWord => {
  try {
    const result = checkProhibitedWords(testWord);
    const status = result.isAllowed ? '✅ ALLOWED' : '❌ BLOCKED';
    console.log(`${testWord.padEnd(20)} - ${status}`);
    if (!result.isAllowed) {
      console.log(`   Reason: ${result.message}`);
    }
  } catch (error) {
    console.log(`${testWord.padEnd(20)} - ⚠️ ERROR: ${error.message}`);
  }
  console.log('');
});
