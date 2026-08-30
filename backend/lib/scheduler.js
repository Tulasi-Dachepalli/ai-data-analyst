import { sendMonthlyAdminReport } from "../routes/admin.js";

let lastSentMonth = null;

export function initScheduler() {
  console.log("[Scheduler] Initializing automated background monthly report scheduler...");

  // Check once every 12 hours
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  
  const checkAndRunMonthlyReport = async () => {
    try {
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
      
      // If it's the first 3 days of the month and we haven't sent for this month yet
      if (now.getDate() <= 3 && lastSentMonth !== currentMonthKey) {
        console.log(`[Scheduler] Triggering automated monthly report for ${currentMonthKey}...`);
        const result = await sendMonthlyAdminReport();
        console.log("[Scheduler] Monthly report dispatch result:", result);
        lastSentMonth = currentMonthKey;
      }
    } catch (err) {
      console.error("[Scheduler] Error running monthly report check:", err);
    }
  };

  // Run initial check 30 seconds after server startup
  setTimeout(checkAndRunMonthlyReport, 30000);

  // Set recurring interval check
  setInterval(checkAndRunMonthlyReport, TWELVE_HOURS);
}
