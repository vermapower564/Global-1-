const { queryDb } = require("../lib/db.ts");

async function checkTasks() {
  try {
    const inProgressTasks = await queryDb(
      "SELECT id, title, section, status, progress, assignedToUserId FROM task WHERE status = 'IN_PROGRESS' ORDER BY updatedAt DESC"
    );
    console.log(`Found ${inProgressTasks.length} task(s) currently IN_PROGRESS in DB:`);
    console.log(JSON.stringify(inProgressTasks, null, 2));

    // Update all in-progress tasks to COMPLETED 100%
    if (inProgressTasks.length > 0) {
      await queryDb("UPDATE task SET status = 'COMPLETED', progress = 100, completedAt = NOW() WHERE status = 'IN_PROGRESS'");
      console.log(`✓ Successfully completed and marked 100% for all ${inProgressTasks.length} in-progress database tasks!`);
    }
  } catch (err) {
    console.error("Task check error:", err);
  }
}

checkTasks();
