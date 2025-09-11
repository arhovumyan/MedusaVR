// Test the shared content filter changes
const fs = require('fs');
const path = require('path');

console.log('Testing shared content filter...');

const sharedFilterPath = path.join(__dirname, 'shared/content-filter.ts');
const sharedContent = fs.readFileSync(sharedFilterPath, 'utf8');

// Check if basic sexual words are still in the shared filter
const sexualWords = ['piss', 'pissing', 'urinate', 'urination', 'golden shower', 'watersports', 'pee play', 'scat', 'scatology', 'prostitution', 'hooker', 'escort service', 'exchange money for sex'];
const harmfulWords = ['rape', 'child', 'minor', 'animal sex', 'bestiality', 'zoophilia', 'incest', 'forced', 'non-consensual'];

console.log('\nChecking if consensual/sexual words were removed from shared filter:');
console.log('===================================================================');

sexualWords.forEach(word => {
  const isStillBlocked = sharedContent.toLowerCase().includes(`'${word}'`) || sharedContent.toLowerCase().includes(`"${word}"`);
  const status = isStillBlocked ? '❌ STILL BLOCKED' : '✅ REMOVED FROM FILTER';
  console.log(`${word.padEnd(20)} - ${status}`);
});

console.log('\nChecking if harmful words are still blocked in shared filter:');
console.log('============================================================');

harmfulWords.forEach(word => {
  const isStillBlocked = sharedContent.toLowerCase().includes(`'${word}'`) || sharedContent.toLowerCase().includes(`"${word}"`);
  const status = isStillBlocked ? '✅ STILL BLOCKED' : '❌ REMOVED (ERROR)';
  console.log(`${word.padEnd(20)} - ${status}`);
});
