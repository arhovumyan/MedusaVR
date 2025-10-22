import mongoose from 'mongoose';

async function checkDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log(' Connected to MongoDB');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n Available collections:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

    // Check conversations collection
    const conversationsCount = await mongoose.connection.db.collection('conversations').countDocuments();
    console.log(`\n Conversations collection: ${conversationsCount} documents`);
    
    if (conversationsCount > 0) {
      const sampleConversation = await mongoose.connection.db.collection('conversations').findOne();
      console.log('\n Sample conversation structure:');
      console.log(JSON.stringify(sampleConversation, null, 2));
    }

    // Check messages collection  
    const messagesCount = await mongoose.connection.db.collection('messages').countDocuments();
    console.log(`\n Messages collection: ${messagesCount} documents`);
    
    if (messagesCount > 0) {
      const sampleMessage = await mongoose.connection.db.collection('messages').findOne();
      console.log('\n Sample message structure:');
      console.log(JSON.stringify(sampleMessage, null, 2));
    }

    // Check chats collection (old system)
    const chatsCount = await mongoose.connection.db.collection('chats').countDocuments();
    console.log(`\n Chats collection (old system): ${chatsCount} documents`);
    
    if (chatsCount > 0) {
      const sampleChat = await mongoose.connection.db.collection('chats').findOne();
      console.log('\n Sample chat structure:');
      console.log(JSON.stringify(sampleChat, null, 2));
    }

  } catch (error) {
    console.error(' Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n Disconnected from MongoDB');
  }
}

checkDatabase();
