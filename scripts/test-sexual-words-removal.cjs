// Simple test for the sexual words filter changes
console.log('Testing if "sex" word is blocked...');

// Read the prohibited words filter file to check
const fs = require('fs');
const path = require('path');

const filterFilePath = path.join(__dirname, 'client/src/lib/prohibitedWordsFilter.ts');
const filterContent = fs.readFileSync(filterFilePath, 'utf8');

// Check if basic sexual words are still in the filter
const sexualWords = ['sex', 'sexual', 'adult', 'consensual', 'intimate', 'erotic', 'nude', 'naked', 'semen', 'cum', 'prostitution'];
const harmfulWords = ['rape', 'child', 'minor', 'animal sex', 'forced sex', 'non-consensual', 'underage', 'bestiality', 'incest'];

console.log('\nChecking if consensual adult sexual words were removed:');
console.log('=======================================================');

sexualWords.forEach(word => {
  const isStillBlocked = filterContent.toLowerCase().includes(`'${word}'`) || filterContent.toLowerCase().includes(`"${word}"`);
  const status = isStillBlocked ? ' STILL BLOCKED' : ' REMOVED FROM FILTER';
  console.log(`${word.padEnd(15)} - ${status}`);
});

console.log('\nChecking if harmful words are still blocked:');
console.log('============================================');

harmfulWords.forEach(word => {
  const isStillBlocked = filterContent.toLowerCase().includes(`'${word}'`) || filterContent.toLowerCase().includes(`"${word}"`);
  const status = isStillBlocked ? ' STILL BLOCKED' : ' REMOVED (ERROR)';
  console.log(`${word.padEnd(15)} - ${status}`);
});

console.log('\nSummary: Basic consensual adult sexual words should be removed, harmful content should remain blocked.');
