import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Character } from '../shared/api-types';

// Define a type guard for the Character interface to check against the JSON data
function isCharacter(obj: any): obj is Character {
    return (
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.persona === 'string' &&
        (typeof obj.scenario === 'string' || typeof obj.scenario === 'undefined') &&
        typeof obj.attributes === 'object' && obj.attributes !== null &&
        (typeof obj.avatar === 'string' || typeof obj.avatar === 'undefined') &&
        (typeof obj.avatarUrl === 'string' || typeof obj.avatarUrl === 'undefined') &&
        typeof obj.creatorId === 'string' &&
        typeof obj.category === 'string' &&
        Array.isArray(obj.tags) && obj.tags.every(t => typeof t === 'string') &&
        typeof obj.isNsfw === 'boolean' &&
        typeof obj.isPublic === 'boolean' &&
        typeof obj.chatCount === 'number' &&
        (typeof obj.likes === 'number' || typeof obj.likes === 'undefined') &&
        typeof obj.rating === 'number' &&
        typeof obj.createdAt === 'string' &&
        typeof obj.updatedAt === 'string'
    );
}

// Main validation function
function validateCharacters() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, '../data/characters.json');
    console.log(`Reading characters from: ${filePath}`);

    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const characters: any[] = JSON.parse(fileContent);

        if (!Array.isArray(characters)) {
            console.error('Error: The JSON file is not an array.');
            return;
        }

        let validCount = 0;
        let invalidCount = 0;

        characters.forEach((character, index) => {
            if (isCharacter(character)) {
                validCount++;
            } else {
                invalidCount++;
                console.warn(`Validation failed for character at index ${index}:`, character);
                // Optional: Log specific missing or invalid fields
                logInvalidFields(character, index);
            }
        });

        console.log('\nValidation Summary:');
        console.log(`  Total characters checked: ${characters.length}`);
        console.log(`  Valid characters: ${validCount}`);
        console.log(`  Invalid characters: ${invalidCount}`);

        if (invalidCount > 0) {
            console.error('\nSome characters failed validation. Please review the warnings above.');
        } else {
            console.log('\nAll characters passed validation successfully!');
        }

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.error(`Error: File not found at ${filePath}`);
        } else if (error instanceof SyntaxError) {
            console.error(`Error: Invalid JSON in ${filePath}. Details: ${error.message}`);
        } else {
            console.error(`An unexpected error occurred: ${error.message}`);
        }
    }
}

// Helper to log which fields are invalid
function logInvalidFields(obj: any, index: number) {
    const expectedFields: (keyof Character)[] = [
        'id', 'name', 'persona', 'scenario', 'attributes', 'avatar', 'avatarUrl',
        'creatorId', 'category', 'tags', 'isNsfw', 'isPublic', 'chatCount',
        'likes', 'rating', 'createdAt', 'updatedAt'
    ];

    for (const field of expectedFields) {
        // A simple check for presence and basic type
        if (field === 'tags' && !Array.isArray(obj[field])) {
            console.log(`  - Character ${index} has invalid 'tags': not an array.`);
        } else if (field === 'attributes' && (typeof obj[field] !== 'object' || obj[field] === null)) {
            console.log(`  - Character ${index} has invalid 'attributes': not an object.`);
        } else if (typeof obj[field] === 'undefined' && !['scenario', 'avatar', 'avatarUrl', 'likes'].includes(field)) {
            console.log(`  - Character ${index} is missing required field: '${field}'.`);
        }
    }
}

// Run the validation
validateCharacters();
