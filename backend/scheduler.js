import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Scheduled task to automatically delete employee days records from 2 months ago
 * Runs on the 1st of every month at 00:01 AM
 */
export function initializeScheduler() {
  // Run on the 1st of every month at 00:01 AM
  // Cron format: minute hour day-of-month month day-of-week
  cron.schedule('1 0 1 * *', async () => {
    try {
      const now = new Date();
      
      // Calculate 2 months ago
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const twoMonthsAgoFormatted = `${twoMonthsAgo.getFullYear()}-${String(twoMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
      
      console.log(`[Scheduler] Running monthly cleanup on ${now.toISOString()}`);
      console.log(`[Scheduler] Deleting employee days records for month: ${twoMonthsAgoFormatted}`);
      
      // Delete all employee days records from 2 months ago
      const result = await prisma.employeeDays.deleteMany({
        where: {
          month: {
            gte: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 1),
            lt: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 1)
          }
        }
      });
      
      console.log(`[Scheduler] Successfully deleted ${result.count} employee days records for ${twoMonthsAgoFormatted}`);
      
    } catch (error) {
      console.error('[Scheduler] Error during monthly cleanup:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Colombo" // Sri Lanka timezone
  });
  
  console.log('[Scheduler] Monthly employee days cleanup task initialized');
  console.log('[Scheduler] Task will run on the 1st of each month at 00:01 AM (Asia/Colombo timezone)');
}

/**
 * Manual cleanup function that can be called via API endpoint for testing
 */
export async function manualCleanup() {
  try {
    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const twoMonthsAgoFormatted = `${twoMonthsAgo.getFullYear()}-${String(twoMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
    
    console.log(`[Manual Cleanup] Deleting employee days records for month: ${twoMonthsAgoFormatted}`);
    
    const result = await prisma.employeeDays.deleteMany({
      where: {
        month: {
          gte: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 1),
          lt: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() + 1, 1)
        }
      }
    });
    
    return {
      success: true,
      deletedCount: result.count,
      monthDeleted: twoMonthsAgoFormatted
    };
    
  } catch (error) {
    console.error('[Manual Cleanup] Error:', error);
    throw error;
  }
}
