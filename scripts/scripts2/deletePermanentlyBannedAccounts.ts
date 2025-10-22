import dotenv from 'dotenv';
import path from 'path';
import { connect, disconnect } from '../lib/db.js';
import { UserModel } from '../db/models/UserModel.js';
import { AccountDeletionService } from '../services/AccountDeletionService.js';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Script to delete permanently banned accounts
 * This should be run periodically to clean up permanently banned users
 */
async function deletePermanentlyBannedAccounts() {
  try {
    console.log(' Starting cleanup of permanently banned accounts...');
    
    // Connect to MongoDB
    await connect();
    console.log(' Connected to MongoDB');

    // Find all permanently banned users
    const permanentlyBannedUsers = await UserModel.find({
      'banInfo.banType': 'permanent',
      'banInfo.isActive': true
    }, '_id username email banInfo createdAt');

    console.log(` Found ${permanentlyBannedUsers.length} permanently banned users`);

    if (permanentlyBannedUsers.length === 0) {
      console.log(' No permanently banned accounts to delete');
      return;
    }

    // Display the users that will be deleted
    console.log('\n Accounts to be deleted:');
    permanentlyBannedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - Banned: ${user.banInfo?.bannedAt || 'Unknown'}`);
    });

    // Confirm deletion (in production, you might want to make this automatic)
    console.log('\n  WARNING: This will permanently delete all data for these users including:');
    console.log('   - User account');
    console.log('   - All conversations');
    console.log('   - All created characters');
    console.log('   - All comments');
    console.log('   - All uploaded images');
    console.log('   - All associated data');
    
    // For automated scripts, you can set this to true
    const AUTO_CONFIRM = process.env.AUTO_DELETE_BANNED_ACCOUNTS === 'true';
    
    if (!AUTO_CONFIRM) {
      console.log('\n❓ To proceed with deletion, set AUTO_DELETE_BANNED_ACCOUNTS=true in your environment');
      console.log('   Or run this script manually with confirmation');
      return;
    }

    console.log('\n Proceeding with automatic deletion...');

    // Delete each account
    const userIds = permanentlyBannedUsers.map(user => user._id.toString());
    const result = await AccountDeletionService.deleteMultipleAccounts(
      userIds, 
      'Automatic cleanup of permanently banned accounts'
    );

    // Report results
    console.log('\n Deletion Results:');
    console.log(` Successfully deleted: ${result.results.filter(r => r.success).length}/${userIds.length} accounts`);
    
    if (result.results.some(r => !r.success)) {
      console.log('\n Failed deletions:');
      result.results.filter(r => !r.success).forEach(failed => {
        console.log(`   - User ID ${failed.userId}: ${failed.message}`);
      });
    }

    // Summary
    const successCount = result.results.filter(r => r.success).length;
    const totalDataDeleted = result.results
      .filter(r => r.success && r.deletedData)
      .reduce((total, r) => {
        const data = r.deletedData;
        return {
          conversations: total.conversations + (data.conversations || 0),
          characters: total.characters + (data.characters || 0),
          comments: total.comments + (data.comments || 0)
        };
      }, { conversations: 0, characters: 0, comments: 0 });

    console.log('\n Summary:');
    console.log(`   - Accounts deleted: ${successCount}`);
    console.log(`   - Conversations removed: ${totalDataDeleted.conversations}`);
    console.log(`   - Characters removed: ${totalDataDeleted.characters}`);
    console.log(`   - Comments removed: ${totalDataDeleted.comments}`);

    console.log('\n Cleanup completed successfully');

  } catch (error) {
    console.error(' Error during cleanup:', error);
  } finally {
    // Disconnect from MongoDB
    await disconnect();
    console.log(' Disconnected from MongoDB');
  }
}

// Run the cleanup
if (require.main === module) {
  deletePermanentlyBannedAccounts().catch(console.error);
}

export { deletePermanentlyBannedAccounts };
