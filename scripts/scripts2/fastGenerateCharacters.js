#!/usr/bin/env node

/**
 * Fast Character Generation CLI
 * 
 * A fast, scalable character generation system that:
 * - Uses your existing RunPod infrastructure with simplified_tester.sh workflow
 * - Creates proper Cloudinary folder structures for each character
 * - Saves characters to database with full metadata
 * - Creates embeddings for search/recommendations
 * - Maintains image number cache for efficiency
 * 
 * Usage:
 * node fastGenerateCharacters.js --count 5
 * node fastGenerateCharacters.js --name "Aria" --description "Magical elf sorceress" --style anime
 * node fastGenerateCharacters.js --batch-templates
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { FastCharacterGenerationService } from '../server/services/FastCharacterGenerationService.js';

interface CLIOptions {
  name?: string;
  description?: string;
  style?: string;
  tags?: string;
  nsfw?: boolean;
  count?: number;
  userId?: string;
  username?: string;
  batchTemplates?: boolean;
  model?: string;
  steps?: number;
  cfg?: number;
  positivePrompt?: string;
  negativePrompt?: string;
}

class FastCharacterGenerationCLI {
  private service: FastCharacterGenerationService;
  private userId: string;
  private username: string;

  constructor() {
    this.service = new FastCharacterGenerationService();
    this.userId = "675b5b3b123456789abcdef0"; // Default system user ID
    this.username = "MedusaVR"; // Default username
  }

  /**
   * Parse command line arguments
   */
  parseArgs(): CLIOptions {
    const args = process.argv.slice(2);
    const options: CLIOptions = {};

    for (let i = 0; i < args.length; i += 2) {
      const key = args[i]?.replace('--', '');
      const value = args[i + 1];

      switch (key) {
        case 'name':
          options.name = value;
          break;
        case 'description':
          options.description = value;
          break;
        case 'style':
          options.style = value;
          break;
        case 'tags':
          options.tags = value;
          break;
        case 'nsfw':
          options.nsfw = value === 'true';
          break;
        case 'count':
          options.count = parseInt(value) || 1;
          break;
        case 'userId':
          options.userId = value;
          break;
        case 'username':
          options.username = value;
          break;
        case 'model':
          options.model = value;
          break;
        case 'steps':
          options.steps = parseInt(value) || 25;
          break;
        case 'cfg':
          options.cfg = parseFloat(value) || 6;
          break;
        case 'positive-prompt':
          options.positivePrompt = value;
          break;
        case 'negative-prompt':
          options.negativePrompt = value;
          break;
        case 'batch-templates':
          options.batchTemplates = true;
          i--; // No value for this flag
          break;
      }
    }

    return options;
  }

  /**
   * Get predefined character templates for batch generation
   */
  getBatchTemplates(): FastGenerationOptions[] {
    return [
      {
        characterName: "Luna Starweaver",
        description: "A mystical elven mage with silver hair and glowing blue eyes. She commands the power of stars and moonlight, weaving spells that can heal or harm. Known for her wisdom and mysterious past.",
        personalityTraits: {
          mainTrait: "mysterious",
          subTraits: ["wise", "caring", "magical"]
        },
        artStyle: { primaryStyle: "fantasy" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["fantasy"],
          'personality': ["mysterious", "wise", "caring"],
          'appearance': ["long-hair", "blue-eyes", "silver-hair"],
          'origin': ["magical", "elven"],
          'content-rating': ["sfw"]
        },
        userId: this.userId,
        username: this.username
      },
      {
        characterName: "Zara Cybershade",
        description: "A high-tech hacker from Neo-Tokyo with cybernetic implants and neon-pink hair. She navigates the digital underworld with unmatched skill and a rebellious spirit.",
        personalityTraits: {
          mainTrait: "rebellious",
          subTraits: ["confident", "tech-savvy", "independent"]
        },
        artStyle: { primaryStyle: "anime" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["sci-fi", "cyberpunk"],
          'personality': ["rebellious", "confident"],
          'appearance': ["colorful-hair", "cybernetic-implants"],
          'origin': ["human"],
          'content-rating': ["sfw"]
        },
        userId: this.userId,
        username: this.username
      },
      {
        characterName: "Captain Aria Blackwater",
        description: "A fearless pirate captain with flowing red hair and emerald eyes. She commands the seven seas with courage and protects the innocent from tyranny.",
        personalityTraits: {
          mainTrait: "brave",
          subTraits: ["leadership", "protective", "adventurous"]
        },
        artStyle: { primaryStyle: "realistic" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["adventure", "historical"],
          'personality': ["brave", "leadership", "protective"],
          'appearance': ["red-hair", "green-eyes"],
          'origin': ["human"],
          'content-rating': ["sfw"]
        },
        userId: this.userId,
        username: this.username
      },
      {
        characterName: "Dr. Elena Nova",
        description: "A brilliant scientist working on quantum physics and space exploration. She has short brown hair, glasses, and an insatiable curiosity about the universe.",
        personalityTraits: {
          mainTrait: "intellectual",
          subTraits: ["curious", "dedicated", "methodical"]
        },
        artStyle: { primaryStyle: "realistic" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["sci-fi", "modern"],
          'personality': ["intellectual", "curious", "dedicated"],
          'appearance': ["short-hair", "glasses", "brown-hair"],
          'origin': ["human"],
          'content-rating': ["sfw"]
        },
        userId: this.userId,
        username: this.username
      },
      {
        characterName: "Sakura Dreamlight",
        description: "A gentle shrine maiden with long black hair and traditional Japanese clothing. She has the ability to see and communicate with spirits, bringing peace to both worlds.",
        personalityTraits: {
          mainTrait: "gentle",
          subTraits: ["spiritual", "peaceful", "empathetic"]
        },
        artStyle: { primaryStyle: "anime" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["fantasy", "spiritual"],
          'personality': ["gentle", "spiritual", "peaceful"],
          'appearance': ["long-hair", "black-hair", "traditional-clothing"],
          'origin': ["human", "spiritual"],
          'content-rating': ["sfw"]
        },
        userId: this.userId,
        username: this.username
      },
      {
        characterName: "Raven Nightshade",
        description: "A gothic vampire with pale skin, long black hair, and piercing red eyes. She walks the line between darkness and light, seeking redemption for her cursed existence.",
        personalityTraits: {
          mainTrait: "dark",
          subTraits: ["mysterious", "complex", "seeking-redemption"]
        },
        artStyle: { primaryStyle: "fantasy" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["fantasy", "gothic", "vampire"],
          'personality': ["dark", "mysterious", "complex"],
          'appearance': ["pale-skin", "black-hair", "red-eyes"],
          'origin': ["vampire", "supernatural"],
          'content-rating': ["sfw"]
        },
        userId: this.userId,
        username: this.username
      },
      {
        characterName: "Maya Stormrider",
        description: "A fearless motorcycle racer with short blonde hair and leather gear. She lives for speed and adrenaline, racing through post-apocalyptic wastelands.",
        personalityTraits: {
          mainTrait: "fearless",
          subTraits: ["adrenaline-junkie", "independent", "tough"]
        },
        artStyle: { primaryStyle: "realistic" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["post-apocalyptic", "action"],
          'personality': ["fearless", "independent", "tough"],
          'appearance': ["short-hair", "blonde-hair", "leather-clothing"],
          'origin': ["human"],
          'content-rating': ["sfw"]
        },
        userId: this.userId,
        username: this.username
      },
      {
        characterName: "Aurora Crystalheart",
        description: "A crystal guardian with iridescent hair that changes color like aurora borealis. She protects ancient magical crystals and has the power to manipulate light and energy.",
        personalityTraits: {
          mainTrait: "guardian",
          subTraits: ["protective", "magical", "serene"]
        },
        artStyle: { primaryStyle: "fantasy" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["fantasy", "magical"],
          'personality': ["guardian", "protective", "serene"],
          'appearance': ["colorful-hair", "magical-aura"],
          'origin': ["magical", "elemental"],
          'content-rating': ["sfw"]
        },
        userId: this.userId,
        username: this.username
      }
    ];
  }

  /**
   * Connect to MongoDB database
   */
  async connectDatabase(): Promise<void> {
    try {
      await mongoose.connect(process.env.MONGODB_URI!, {
        dbName: "test",
      });
      console.log(" MongoDB connected successfully");
    } catch (error) {
      console.error(" MongoDB connection failed:", error);
      throw error;
    }
  }

  /**
   * Create FastGenerationOptions from CLI arguments
   */
  createOptionsFromCLI(options: CLIOptions): FastGenerationOptions {
    const tags = options.tags ? options.tags.split(',') : ['friendly'];
    
    return {
      characterName: options.name || "Generated Character",
      description: options.description || "A unique character generated by MedusaVR AI system.",
      personalityTraits: {
        mainTrait: tags[0] || "friendly",
        subTraits: tags.slice(1, 4) || ["kind", "helpful"]
      },
      artStyle: { primaryStyle: options.style || "anime" },
      selectedTags: {
        'character-type': ["female"],
        'personality': tags,
        'content-rating': [options.nsfw ? "nsfw" : "sfw"]
      },
      userId: options.userId || this.userId,
      username: options.username || this.username,
      isNsfw: options.nsfw || false,
      model: options.model,
      steps: options.steps,
      cfg: options.cfg,
      positivePromptFile: options.positivePrompt,
      negativePromptFile: options.negativePrompt
    };
  }

  /**
   * Display help information
   */
  displayHelp(): void {
    console.log(`
 MedusaVR Fast Character Generation CLI

Usage:
  node fastGenerateCharacters.js [options]

Options:
  --name "Character Name"           Name of the character to generate
  --description "Description"      Character description
  --style anime|realistic|fantasy  Art style (default: anime)
  --tags tag1,tag2,tag3            Personality tags (comma-separated)
  --nsfw true|false               Generate NSFW content (default: false)
  --count 5                       Number of characters to generate
  --userId "user_id"              User ID for character ownership
  --username "username"           Username for folder structure
  --model "model.safetensors"     Specific model to use
  --steps 25                      Generation steps (default: 25)
  --cfg 6                         CFG scale (default: 6)
  --positive-prompt "file.txt"    Custom positive prompt file
  --negative-prompt "file.txt"    Custom negative prompt file
  --batch-templates               Use predefined character templates

Examples:
  # Generate a single character
  node fastGenerateCharacters.js --name "Aria" --description "Magical elf" --style fantasy

  # Generate multiple characters from templates
  node fastGenerateCharacters.js --batch-templates --count 5

  # Generate with custom settings
  node fastGenerateCharacters.js --name "Luna" --description "Cyberpunk hacker" --style anime --steps 30 --cfg 8

Note: Make sure your RunPod environment is running and the URL is set in your .env file.
    `);
  }

  /**
   * Main execution function
   */
  async run(): Promise<void> {
    try {
      const options = this.parseArgs();

      // Display help if no arguments provided
      if (process.argv.length <= 2) {
        this.displayHelp();
        return;
      }

      console.log(' MedusaVR Fast Character Generation Starting...\n');
      console.log(' Options:', JSON.stringify(options, null, 2));

      // Override user settings if provided
      if (options.userId) this.userId = options.userId;
      if (options.username) this.username = options.username;

      // Connect to database
      await this.connectDatabase();

      if (options.batchTemplates) {
        // Generate from predefined templates
        console.log(' Generating characters from predefined templates...');
        const templates = this.getBatchTemplates();
        const count = Math.min(options.count || 5, templates.length);
        const selectedTemplates = templates.slice(0, count);

        console.log(` Selected ${selectedTemplates.length} templates:`);
        selectedTemplates.forEach((template, index) => {
          console.log(`  ${index + 1}. ${template.characterName} (${template.artStyle.primaryStyle})`);
        });

        const results = await this.service.generateBatchCharactersFast(selectedTemplates, 2, 3000);
        
        console.log('\n Generation Results:');
        results.forEach((result, index) => {
          if (result.success) {
            console.log(` ${index + 1}. ${result.character?.name} - ID: ${result.character?.id} (${result.generationTime}s)`);
            console.log(`   Avatar: ${result.imageUrl}`);
          } else {
            console.log(` ${index + 1}. ${selectedTemplates[index].characterName} - Error: ${result.error}`);
          }
        });

      } else if (options.name && options.description) {
        // Generate single character from CLI args
        console.log(' Generating single character from CLI arguments...');
        const generationOptions = this.createOptionsFromCLI(options);
        
        console.log(` Generating: ${generationOptions.characterName}`);
        console.log(` Style: ${generationOptions.artStyle.primaryStyle}`);
        console.log(` Description: ${generationOptions.description}`);

        const result = await this.service.generateCharacterFast(generationOptions);
        
        if (result.success) {
          console.log('\n Character generated successfully!');
          console.log(`🆔 Character ID: ${result.character?.id}`);
          console.log(`👤 Name: ${result.character?.name}`);
          console.log(` Avatar: ${result.imageUrl}`);
          console.log(`⏱️ Generation time: ${result.generationTime}s`);
          console.log(`🌱 Character seed: ${result.characterSeed}`);
        } else {
          console.error(` Generation failed: ${result.error}`);
        }

      } else {
        // Generate multiple characters with random names
        console.log(' Generating random characters...');
        const count = options.count || 3;
        const templates = this.getBatchTemplates();
        const selectedTemplates = templates.slice(0, count);

        const results = await this.service.generateBatchCharactersFast(selectedTemplates, 2, 2000);
        
        console.log('\n Generation Summary:');
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        console.log(` Successful: ${successful}`);
        console.log(` Failed: ${failed}`);
        console.log(` Success rate: ${(successful / results.length * 100).toFixed(1)}%`);
      }

      console.log('\n Fast character generation completed!');

    } catch (error) {
      console.error(' Fast character generation failed:', error);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
      console.log(' Database disconnected');
    }
  }
}

// Run the CLI
const cli = new FastCharacterGenerationCLI();
cli.run().catch(console.error);
