import { obfuscationFilter, checkObfuscatedContent } from '../shared/obfuscation-filter.ts';

console.log('Testing Comprehensive Obfuscation Filter:');

const testCases = [
    // Direct words
    'child', 'dog', 'animal', 'minor', 'teen',
    
    // Number substitutions
    'ch1ld', 'd0g', 'an1mal', 'm1nor', 't33n',
    
    // Symbol substitutions
    'ch!ld', 'd@g', '@nimal', 'm!nor', 'k1d',
    
    // Mixed obfuscation
    'ch1!d', 'd0@g', 'an!m@l', 'm1n0r',
    
    // Spacing tricks
    'c h i l d', 'd o g', 'a n i m a l',
    
    // Dots and separators
    'c.h.i.l.d', 'd.o.g', 'a-n-i-m-a-l',
    
    // Case variations
    'ChIlD', 'DoG', 'AnImAl', 'MiNoR',
    
    // Clean words
    'hello', 'world', 'computer', 'programming',
    
    // Sentences with obfuscated words
    'I have a d0g',
    'This ch1ld is playing',
    'My @nimal friend is cute',
    'He is a m1nor character',
    'T33n content here'
];

console.log('\n=== Individual Word Testing ===');
testCases.forEach(testCase => {
    const isDetected = checkObfuscatedContent(testCase);
    const details = obfuscationFilter.getDetectionDetails(testCase);
    console.log(`"${testCase}" - ${isDetected ? '🚫 BLOCKED' : '✅ ALLOWED'}`);
    if (isDetected && details.matches.length > 0) {
        console.log(`  -> Matched: ${details.matches.map(m => `${m.type}: ${m.normalized || m.text}`).join(', ')}`);
    }
});

console.log('\n=== Sentence Censoring ===');
const sentences = [
    'I love my d0g very much',
    'This ch1ld is very smart', 
    'My @nimal companion',
    'He is just a m1nor issue',
    'T33n drama is annoying',
    'Clean sentence with no issues',
    'Multiple issues: ch1ld and d0g together'
];

sentences.forEach(sentence => {
    const isBlocked = checkObfuscatedContent(sentence);
    const censored = obfuscationFilter.censorContent(sentence);
    console.log(`Original: "${sentence}"`);
    console.log(`Status: ${isBlocked ? '🚫 BLOCKED' : '✅ ALLOWED'}`);
    console.log(`Censored: "${censored}"`);
    console.log('---');
});
