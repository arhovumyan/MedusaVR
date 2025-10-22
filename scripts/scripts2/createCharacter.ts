
// server/scripts/createCharacter.ts
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { connect, disconnect } from '../lib/db';
import { CharacterModel } from '../db/models/CharacterModel';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function createCharacter() {
  try {
    await connect();

    const imagePath = path.join(__dirname, '../../medusaVR_Photos/00005-2995282163.png'); // Specify the image file
    const imageName = 'Seraphina'; // Specify character name
    const characterDescription = 'A mysterious and alluring woman with a dark past.'; // Specify character description

    const uploadResult = await cloudinary.uploader.upload(imagePath, {
      folder: 'character-avatars',
    });

    const newCharacter = new CharacterModel({
      id: Math.floor(Math.random() * 1000000),
      avatar: uploadResult.secure_url,
      name: imageName,
      description: characterDescription,
      nsfw: true,
      selectedTags: {
        'character-type': ['female'],
        'genre': ['hentai'],
        'personality': ['flirty'],
        'appearance': ['curvy'],
        'content-rating': ['nsfw'],
      },
      imageMetadata: {
        cloudinaryPublicId: uploadResult.public_id,
      },
    });

    await newCharacter.save();
    console.log('Character created successfully!');
  } catch (error) {
    console.error('Error creating character:', error);
  } finally {
    await disconnect();
  }
}

createCharacter();
