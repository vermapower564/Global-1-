const { queryDb } = require("../lib/db");

async function checkAssignedStaff() {
  try {
    const rows = await queryDb("SELECT * FROM _assignedstaffprojects LIMIT 20");
    console.log("=== _assignedstaffprojects rows ===");
    console.log(rows);

    const users = await queryDb("SELECT id, name, employeeId, role FROM user LIMIT 10");
    console.log("=== Users ===");
    console.log(users);

    const projects = await queryDb("SELECT id, projectTitle FROM project LIMIT 10");
    console.log("=== Projects ===");
    console.log(projects);
  } catch (e) {
    console.error(e);
  }
}

checkAssignedStaff();
