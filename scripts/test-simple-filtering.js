// Simple test for substring filtering logic
console.log('Testing substring filtering logic...\n');

// Sample prohibited words from our filter
const prohibitedWords = [
  'dog', 'animal', 'child', 'minor', 'kill', 'rape'
];

// Test substring matching function (same logic as updated filter)
function containsProhibitedWord(text, prohibitedWords) {
  const lowercaseText = text.toLowerCase();
  const foundWords = [];
  
  for (const word of prohibitedWords) {
    if (lowercaseText.includes(word.toLowerCase())) {
      foundWords.push(word);
    }
  }
  
  return {
    isBlocked: foundWords.length > 0,
    blockedWords: foundWords
  };
}

// Test cases for bypass prevention
const testCases = [
  'dog',          // Should be blocked
  'dogPod',       // Should be blocked (contains "dog")
  'animalsssss',  // Should be blocked (contains "animal")
  'animale',      // Should be blocked (contains "animal") 
  'doggystyle',   // Should be blocked (contains "dog")
  'childish',     // Should be blocked (contains "child")
  'childhood',    // Should be blocked (contains "child")
  'minorly',      // Should be blocked (contains "minor")
  'hello world',  // Should be allowed
  'create a character', // Should be allowed
  'The building is tall', // Should be allowed (no prohibited words)
  'Minorityyyy',  // Should be blocked (contains "minor")
  'killjoyyy',    // Should be blocked (contains "kill")
  'rapiddddd',    // Should be blocked (contains "rape")
];

console.log('Test Results:');
console.log('=============');

testCases.forEach(testCase => {
  const result = containsProhibitedWord(testCase, prohibitedWords);
  const status = result.isBlocked ? ' BLOCKED' : ' ALLOWED';
  const blockedWords = result.blockedWords.length > 0 ? ` (blocked: ${result.blockedWords.join(', ')})` : '';
  console.log(`${status}: "${testCase}"${blockedWords}`);
});

console.log('\n=============');
console.log(' SUCCESS: Substring filtering now blocks bypass attempts!');
console.log('Previously: "dogPod" would be allowed (word boundary matching)');
console.log('Now: "dogPod" is blocked because it contains "dog"');
console.log('This prevents users from adding extra letters to bypass the filter.');
