#!/usr/bin/env node

// Simple test for the updated substring filtering
import { checkProhibitedWords } from '../client/src/lib/prohibitedWordsFilter.js';

console.log('Testing substring filtering...\n');

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
];

console.log('Test Results:');
console.log('=============');

testCases.forEach(testCase => {
  try {
    const result = checkProhibitedWords(testCase);
    const status = result.isAllowed ? ' ALLOWED' : ' BLOCKED';
    const blockedWords = result.blockedWords.length > 0 ? ` (blocked: ${result.blockedWords.join(', ')})` : '';
    console.log(`${status}: "${testCase}"${blockedWords}`);
  } catch (error) {
    console.log(`  ERROR: "${testCase}" - ${error.message}`);
  }
});

console.log('\n=============');
console.log('Expected behavior: All words containing prohibited terms should be BLOCKED');
console.log('This prevents bypass attempts like "dogPod", "animalsssss", etc.');
