import { deletePermanentlyBannedAccounts } from './deletePermanentlyBannedAccounts.js';

/**
 * Scheduled Account Cleanup Script
 * This script should be run periodically (e.g., daily) to clean up permanently banned accounts
 * 
 * Usage:
 * - Set up as a cron job: 0 2 * * * /path/to/node /path/to/scheduledAccountCleanup.js
 * - Run manually: npm run cleanup-banned-accounts
 * - Run with auto-confirm: AUTO_DELETE_BANNED_ACCOUNTS=true npm run cleanup-banned-accounts
 */

async function scheduledCleanup() {
  console.log('🕐 Starting scheduled account cleanup...');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  
  try {
    await deletePermanentlyBannedAccounts();
    console.log('✅ Scheduled cleanup completed successfully');
  } catch (error) {
    console.error('❌ Scheduled cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
if (require.main === module) {
  scheduledCleanup().catch(console.error);
}

export { scheduledCleanup };
