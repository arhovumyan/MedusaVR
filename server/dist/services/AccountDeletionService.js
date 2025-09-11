import { UserModel } from '../db/models/UserModel.js';
import { ChatsModel } from '../db/models/ChatsModel.js';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { CommentModel } from '../db/models/CommentModel.js';
import { CloudinaryFolderService } from './CloudinaryFolderService.js';
/**
 * Account Deletion Service
 * Handles complete deletion of user accounts and all associated data
 */
export class AccountDeletionService {
    /**
     * Delete a user account and all associated data
     * @param userId - The user ID to delete
     * @param reason - Reason for deletion (e.g., "permanent ban")
     * @returns Promise<{success: boolean, message: string, deletedData?: any}>
     */
    static async deleteUserAccount(userId, reason = 'Account deletion') {
        try {
            console.log(`🗑️ Starting account deletion for user: ${userId}, reason: ${reason}`);
            // Get user data before deletion
            const user = await UserModel.findById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }
            const username = user.username;
            const deletedData = {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                },
                conversations: 0,
                characters: 0,
                comments: 0,
                cloudinaryCleanup: false
            };
            // 1. Delete user's conversations
            const conversationsResult = await ChatsModel.deleteMany({ userId });
            deletedData.conversations = conversationsResult.deletedCount;
            console.log(`🗑️ Deleted ${deletedData.conversations} conversations for user ${username}`);
            // 2. Delete user's created characters
            const charactersResult = await CharacterModel.deleteMany({ creatorId: userId });
            deletedData.characters = charactersResult.deletedCount;
            console.log(`🗑️ Deleted ${deletedData.characters} characters created by user ${username}`);
            // 3. Delete user's comments
            const commentsResult = await CommentModel.deleteMany({ userId });
            deletedData.comments = commentsResult.deletedCount;
            console.log(`🗑️ Deleted ${deletedData.comments} comments by user ${username}`);
            // 4. Clean up Cloudinary folders (if Cloudinary is configured)
            try {
                const cloudinaryResult = await CloudinaryFolderService.cleanupUserFolders(username);
                deletedData.cloudinaryCleanup = cloudinaryResult;
                console.log(`🗑️ Cloudinary cleanup for user ${username}: ${cloudinaryResult ? 'success' : 'failed'}`);
            }
            catch (cloudinaryError) {
                console.warn(`⚠️ Cloudinary cleanup failed for user ${username}:`, cloudinaryError);
                deletedData.cloudinaryCleanup = false;
            }
            // 5. Delete the user account itself
            await UserModel.findByIdAndDelete(userId);
            console.log(`🗑️ Deleted user account: ${username}`);
            // 6. Log the deletion for audit purposes
            console.log(`✅ ACCOUNT DELETION COMPLETE:`, {
                userId,
                username,
                reason,
                deletedData,
                timestamp: new Date().toISOString()
            });
            return {
                success: true,
                message: `Account and all associated data deleted successfully`,
                deletedData
            };
        }
        catch (error) {
            console.error(`❌ Account deletion failed for user ${userId}:`, error);
            return {
                success: false,
                message: `Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Delete multiple user accounts (for batch operations)
     * @param userIds - Array of user IDs to delete
     * @param reason - Reason for deletion
     * @returns Promise<{success: boolean, results: Array<{userId: string, success: boolean, message: string}>}>
     */
    static async deleteMultipleAccounts(userIds, reason = 'Batch account deletion') {
        console.log(`🗑️ Starting batch deletion of ${userIds.length} accounts, reason: ${reason}`);
        const results = [];
        for (const userId of userIds) {
            try {
                const result = await this.deleteUserAccount(userId, reason);
                results.push({
                    userId,
                    success: result.success,
                    message: result.message,
                    deletedData: result.deletedData
                });
            }
            catch (error) {
                results.push({
                    userId,
                    success: false,
                    message: `Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
        }
        const successCount = results.filter(r => r.success).length;
        console.log(`✅ Batch deletion complete: ${successCount}/${userIds.length} accounts deleted successfully`);
        return {
            success: successCount === userIds.length,
            results
        };
    }
    /**
     * Get accounts that should be deleted (e.g., permanently banned users)
     * @returns Promise<Array<{userId: string, username: string, reason: string}>>
     */
    static async getAccountsForDeletion() {
        try {
            // This would typically query a database table that tracks banned users
            // For now, we'll return an empty array as this would be implemented
            // based on your specific ban tracking system
            console.log('🔍 Checking for accounts that should be deleted...');
            // TODO: Implement based on your ban tracking system
            // Example implementation:
            // const bannedUsers = await BanModel.find({ 
            //   banType: 'permanent', 
            //   shouldDeleteAccount: true,
            //   accountDeleted: false 
            // });
            return [];
        }
        catch (error) {
            console.error('❌ Error checking for accounts to delete:', error);
            return [];
        }
    }
    /**
     * Schedule account deletion for permanently banned users
     * This should be called when a user receives a permanent ban
     * @param userId - The user ID to schedule for deletion
     * @param reason - Reason for the ban and deletion
     * @returns Promise<boolean>
     */
    static async scheduleAccountDeletion(userId, reason) {
        try {
            console.log(`📅 Scheduling account deletion for permanently banned user: ${userId}`);
            // For immediate deletion (recommended for permanent bans)
            const result = await this.deleteUserAccount(userId, `Permanent ban: ${reason}`);
            if (result.success) {
                console.log(`✅ Account deletion completed for permanently banned user: ${userId}`);
                return true;
            }
            else {
                console.error(`❌ Failed to delete account for permanently banned user: ${userId}`);
                return false;
            }
        }
        catch (error) {
            console.error(`❌ Error scheduling account deletion for user ${userId}:`, error);
            return false;
        }
    }
}
export default AccountDeletionService;
