import { UserModel } from '../db/models/UserModel';
import mongoose from 'mongoose';

async function addCoinsToUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aicompanion');
    console.log('✅ Connected to MongoDB');
    
    const userId = '68658bf000952fc18d365209'; // Your user ID from the logs
    const coinsToAdd = 100; // Test pack coins
    
    console.log(`🪙 Adding ${coinsToAdd} coins to user ${userId}...`);
    
    const result = await UserModel.findByIdAndUpdate(
      userId,
      { $inc: { coins: coinsToAdd } },
      { new: true }
    );
    
    if (result) {
      console.log(`✅ Successfully added coins! New balance: ${result.coins}`);
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('❌ Error adding coins:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

addCoinsToUser();
