const { queryDb } = require("../lib/db");

async function checkRel() {
  try {
    const desc = await queryDb("DESCRIBE _assignedstaffprojects");
    console.log("=== _assignedstaffprojects schema ===");
    console.log(desc);
  } catch (e) {
    console.error(e);
  }
}

checkRel();
