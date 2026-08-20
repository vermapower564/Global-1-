const { queryDb } = require("../lib/db");

async function checkTasks() {
  const inProgressTasks = await queryDb(
    "SELECT id, title, section, status, progress, assignedToUserId FROM task WHERE status = 'IN_PROGRESS' ORDER BY updatedAt DESC"
  );
  console.log(`Found ${inProgressTasks.length} task(s) currently IN_PROGRESS in DB:`);
  console.log(JSON.stringify(inProgressTasks, null, 2));

  const allActiveTasks = await queryDb(
    "SELECT id, title, section, status, progress FROM task WHERE status IN ('IN_PROGRESS', 'PENDING', 'ASSIGNED', 'NEW', 'UNDER_REVIEW') ORDER BY updatedAt DESC LIMIT 10"
  );
  console.log(`\nActive tasks in DB (${allActiveTasks.length}):`);
  console.log(JSON.stringify(allActiveTasks, null, 2));
}

checkTasks();
