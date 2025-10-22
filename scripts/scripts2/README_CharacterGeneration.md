# Character Generation Script

This script generates characters using the same data structure and procedure as the create character page.

## Features

- **Random Selection**: Automatically selects one art style, one tag from each category, and generates appropriate names and prompts
- **Full Integration**: Uses the same FastCharacterGenerationService as the web interface
- **Complete Pipeline**: Generates images, uploads to Bunny CDN, creates database entries, and generates embeddings
- **Smart Naming**: Creates character names based on personality traits and character type
- **Dynamic Prompts**: Builds prompts based on selected tags, personality, and art style

## Usage

### Test Mode (Create 1 Character)
```bash
npx tsx server/scripts/generateCharactersFromData.ts --test
```

### Create Multiple Characters
```bash
# Create 5 characters (default)
npx tsx server/scripts/generateCharactersFromData.ts

# Create 10 characters
npx tsx server/scripts/generateCharactersFromData.ts 10

# Create 20 characters
npx tsx server/scripts/generateCharactersFromData.ts 20
```

## What It Does

1. **Connects to Database**: Uses MongoDB connection from .env
2. **Creates Batch User**: Sets up a dedicated user for batch operations
3. **Generates Character Template**: 
   - Random personality trait (with sub-trait)
   - Random art style
   - One tag from each category (character-type, genre, personality, appearance, origin, fantasy, ethnicity, scenario, profession)
   - Generated name based on personality and character type
   - Dynamic description and quick suggestion
   - AI-optimized prompts
4. **Creates Character**: Uses FastCharacterGenerationService to:
   - Generate image via RunPod
   - Upload to Bunny CDN
   - Save to database
   - Generate embeddings
5. **Reports Results**: Shows success/failure counts

## Generated Character Example

**Name**: Blaze Calm  
**Art Style**: Cartoon  
**Personality**: Calm (peaceful traits)  
**Tags**: animal, sci-fi, cyberpunk, fantasy, caring, confident, rebellious, glasses, long-hair, human, superhuman, asian, teacher, detective, doctor  
**Description**: A character with calm personality, specifically embodying peaceful traits...  
**Quick Suggestion**: "Would you like to join me for some peaceful meditation?"  
**Image**: Generated and uploaded to Bunny CDN  
**Database ID**: Saved with unique ID  

## Requirements

- MongoDB connection configured in .env
- RunPod URLs configured in .env
- Bunny CDN credentials configured
- All dependencies installed

## Output

The script provides detailed logging of:
- Character template generation
- Image generation progress
- Upload status
- Database operations
- Final results summary

## Error Handling

- Skips characters that already exist
- Handles RunPod failures gracefully
- Reports detailed error messages
- Continues processing remaining characters
