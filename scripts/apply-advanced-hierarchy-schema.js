const { queryDb } = require("../lib/db");

async function applyAdvancedSchema() {
  try {
    console.log("Adding parentTaskId and isMainTask columns to task table...");

    try {
      await queryDb("ALTER TABLE task ADD COLUMN parentTaskId VARCHAR(191) NULL");
      console.log("✓ Added parentTaskId to task");
    } catch (e) {
      console.log("parentTaskId note:", e.message);
    }

    try {
      await queryDb("ALTER TABLE task ADD COLUMN isMainTask TINYINT(1) NOT NULL DEFAULT 0");
      console.log("✓ Added isMainTask to task");
    } catch (e) {
      console.log("isMainTask note:", e.message);
    }

    // Backfill any existing top-level tasks created by Admin as Main Tasks
    const mainTasks = await queryDb("SELECT id, title, projectId, assignedToUserId FROM task WHERE projectId IS NOT NULL LIMIT 10");
    for (const mt of mainTasks) {
      await queryDb("UPDATE task SET isMainTask = 1 WHERE id = ?", [mt.id]);
    }

    console.log("✓ Advanced schema upgrade completed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

applyAdvancedSchema();
