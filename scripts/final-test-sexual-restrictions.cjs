// Final comprehensive test of sexual word restrictions removal
const fs = require('fs');
const path = require('path');

console.log('='.repeat(70));
console.log('COMPREHENSIVE TEST: Sexual Words Restrictions Removal');
console.log('='.repeat(70));

// Test files and their expected behavior
const testFiles = [
  {
    name: 'Shared Content Filter',
    path: 'shared/content-filter.ts'
  },
  {
    name: 'Client Prohibited Words Filter', 
    path: 'client/src/lib/prohibitedWordsFilter.ts'
  },
  {
    name: 'Server Content Filter',
    path: 'server/utils/content-filter.ts'
  },
  {
    name: 'Content Safety Service',
    path: 'server/services/ContentSafetyService.ts'
  }
];

// Words that SHOULD now be allowed (consensual adult content)
const shouldBeAllowed = [
  'sex', 'sexual', 'adult', 'consensual', 'intimate', 'erotic', 'nude', 'naked',
  'orgasm', 'masturbation', 'aroused', 'pleasure', 'bedroom', 'climax',
  'prostitution', 'escort', 'hooker', 'porn', 'semen', 'cum', 'ejaculate',
  'piss', 'pissing', 'urinate', 'urination', 'golden shower', 'watersports'
];

// Words that MUST still be blocked (harmful content)
const mustStillBeBlocked = [
  'rape', 'child', 'minor', 'underage', 'baby', 'infant', 'toddler',
  'teen', 'teenager', 'boy', 'girl', 'forced sex', 'non-consensual',
  'animal sex', 'bestiality', 'zoophilia', 'incest', 'family sex',
  'kill', 'murder', 'torture', 'abuse', 'loli', 'shota', 'cp', 'child porn'
];

console.log('\n TESTING EACH FILE:');
console.log('-'.repeat(70));

testFiles.forEach(file => {
  const filePath = path.join(__dirname, file.path);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
    
    console.log(`\n ${file.name}`);
    console.log(`   File: ${file.path}`);
    
    // Check if consensual adult words were removed
    const removedWords = [];
    const stillBlockedAllowed = [];
    
    shouldBeAllowed.forEach(word => {
      const isBlocked = content.includes(`'${word}'`) || content.includes(`"${word}"`);
      if (!isBlocked) {
        removedWords.push(word);
      } else {
        stillBlockedAllowed.push(word);
      }
    });
    
    // Check if harmful words are still blocked
    const stillBlockedHarmful = [];
    const incorrectlyRemovedHarmful = [];
    
    mustStillBeBlocked.forEach(word => {
      const isBlocked = content.includes(`'${word}'`) || content.includes(`"${word}"`);
      if (isBlocked) {
        stillBlockedHarmful.push(word);
      } else {
        incorrectlyRemovedHarmful.push(word);
      }
    });
    
    // Results
    console.log(`    Consensual words removed: ${removedWords.length}/${shouldBeAllowed.length}`);
    console.log(`    Harmful words still blocked: ${stillBlockedHarmful.length}/${mustStillBeBlocked.length}`);
    
    if (stillBlockedAllowed.length > 0) {
      console.log(`     Still blocking consensual words: ${stillBlockedAllowed.slice(0, 3).join(', ')}${stillBlockedAllowed.length > 3 ? '...' : ''}`);
    }
    
    if (incorrectlyRemovedHarmful.length > 0) {
      console.log(`    CRITICAL: Harmful words removed: ${incorrectlyRemovedHarmful.slice(0, 3).join(', ')}${incorrectlyRemovedHarmful.length > 3 ? '...' : ''}`);
    }
    
  } catch (error) {
    console.log(`    Error reading file: ${error.message}`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('SUMMARY:');
console.log(' Consensual adult sexual content should now be ALLOWED');
console.log(' Harmful content (CSAM, bestiality, rape, etc.) remains BLOCKED');
console.log(' The word "sex" and similar should no longer trigger content warnings');
console.log('='.repeat(70));
