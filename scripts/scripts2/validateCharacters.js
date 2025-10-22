"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var url_1 = require("url");
// Define a type guard for the Character interface to check against the JSON data
function isCharacter(obj) {
    return (typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.persona === 'string' &&
        (typeof obj.scenario === 'string' || typeof obj.scenario === 'undefined') &&
        typeof obj.attributes === 'object' && obj.attributes !== null &&
        (typeof obj.avatar === 'string' || typeof obj.avatar === 'undefined') &&
        (typeof obj.avatarUrl === 'string' || typeof obj.avatarUrl === 'undefined') &&
        typeof obj.creatorId === 'string' &&
        typeof obj.category === 'string' &&
        Array.isArray(obj.tags) && obj.tags.every(function (t) { return typeof t === 'string'; }) &&
        typeof obj.isNsfw === 'boolean' &&
        typeof obj.isPublic === 'boolean' &&
        typeof obj.chatCount === 'number' &&
        (typeof obj.likes === 'number' || typeof obj.likes === 'undefined') &&
        typeof obj.rating === 'number' &&
        typeof obj.createdAt === 'string' &&
        typeof obj.updatedAt === 'string');
}
// Main validation function
function validateCharacters() {
    var __filename = (0, url_1.fileURLToPath)(import.meta.url);
    var __dirname = path.dirname(__filename);
    var filePath = path.join(__dirname, '../data/characters.json');
    console.log("Reading characters from: ".concat(filePath));
    try {
        var fileContent = fs.readFileSync(filePath, 'utf-8');
        var characters = JSON.parse(fileContent);
        if (!Array.isArray(characters)) {
            console.error('Error: The JSON file is not an array.');
            return;
        }
        var validCount_1 = 0;
        var invalidCount_1 = 0;
        characters.forEach(function (character, index) {
            if (isCharacter(character)) {
                validCount_1++;
            }
            else {
                invalidCount_1++;
                console.warn("Validation failed for character at index ".concat(index, ":"), character);
                // Optional: Log specific missing or invalid fields
                logInvalidFields(character, index);
            }
        });
        console.log('\nValidation Summary:');
        console.log("  Total characters checked: ".concat(characters.length));
        console.log("  Valid characters: ".concat(validCount_1));
        console.log("  Invalid characters: ".concat(invalidCount_1));
        if (invalidCount_1 > 0) {
            console.error('\nSome characters failed validation. Please review the warnings above.');
        }
        else {
            console.log('\nAll characters passed validation successfully!');
        }
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            console.error("Error: File not found at ".concat(filePath));
        }
        else if (error instanceof SyntaxError) {
            console.error("Error: Invalid JSON in ".concat(filePath, ". Details: ").concat(error.message));
        }
        else {
            console.error("An unexpected error occurred: ".concat(error.message));
        }
    }
}
// Helper to log which fields are invalid
function logInvalidFields(obj, index) {
    var expectedFields = [
        'id', 'name', 'persona', 'scenario', 'attributes', 'avatar', 'avatarUrl',
        'creatorId', 'category', 'tags', 'isNsfw', 'isPublic', 'chatCount',
        'likes', 'rating', 'createdAt', 'updatedAt'
    ];
    for (var _i = 0, expectedFields_1 = expectedFields; _i < expectedFields_1.length; _i++) {
        var field = expectedFields_1[_i];
        // A simple check for presence and basic type
        if (field === 'tags' && !Array.isArray(obj[field])) {
            console.log("  - Character ".concat(index, " has invalid 'tags': not an array."));
        }
        else if (field === 'attributes' && (typeof obj[field] !== 'object' || obj[field] === null)) {
            console.log("  - Character ".concat(index, " has invalid 'attributes': not an object."));
        }
        else if (typeof obj[field] === 'undefined' && !['scenario', 'avatar', 'avatarUrl', 'likes'].includes(field)) {
            console.log("  - Character ".concat(index, " is missing required field: '").concat(field, "'."));
        }
    }
}
// Run the validation
validateCharacters();
