const { queryDb } = require("../lib/db");

async function updateSchemaAndData() {
  try {
    console.log("Adding non-destructive columns to project and task...");
    
    // Add teamLeaderId and description to project if not exist
    try {
      await queryDb("ALTER TABLE project ADD COLUMN teamLeaderId VARCHAR(191) NULL");
      console.log("✓ Added teamLeaderId to project");
    } catch (e) {
      console.log("teamLeaderId already exists or note:", e.message);
    }

    try {
      await queryDb("ALTER TABLE project ADD COLUMN description TEXT NULL");
      console.log("✓ Added description to project");
    } catch (e) {
      console.log("description already exists or note:", e.message);
    }

    // Add section and reviewNotes to task if not exist
    try {
      await queryDb("ALTER TABLE task ADD COLUMN section VARCHAR(191) NULL");
      console.log("✓ Added section to task");
    } catch (e) {
      console.log("section already exists or note:", e.message);
    }

    try {
      await queryDb("ALTER TABLE task ADD COLUMN reviewNotes TEXT NULL");
      console.log("✓ Added reviewNotes to task");
    } catch (e) {
      console.log("reviewNotes already exists or note:", e.message);
    }

    // Let's populate teamLeaderId on existing projects if empty
    const projects = await queryDb("SELECT id, projectTitle, teamLeaderId FROM project");
    const users = await queryDb("SELECT id, name, employeeId, role FROM user");

    const roushan = users.find(u => u.employeeId === "EMP-8595") || users[0];
    const amit = users.find(u => u.employeeId === "EMP-7592") || users[1];
    const sneha = users.find(u => u.employeeId === "EMP-2139") || users[2];
    const aditya = users.find(u => u.employeeId === "EMP014") || users[3];
    const rajesh = users.find(u => u.employeeId === "EMP-6841") || users[4];
    const priya = users.find(u => u.employeeId === "EMP-8219" || u.employeeId === "EMP002") || users[5];

    for (const p of projects) {
      let leader = roushan;
      let members = [aditya, rajesh, priya];

      if (p.projectTitle.includes("Finance") || p.projectTitle.includes("Billing") || p.projectTitle.includes("FinTech")) {
        leader = amit;
        members = [roushan, aditya, rajesh];
      } else if (p.projectTitle.includes("Design") || p.projectTitle.includes("Obsidian")) {
        leader = sneha;
        members = [aditya, priya, roushan];
      }

      if (!p.teamLeaderId && leader) {
        await queryDb("UPDATE project SET teamLeaderId = ?, description = ? WHERE id = ?", [
          leader.id,
          `Enterprise deliverable for ${p.projectTitle}. Focus on high performance, secure role permissions, modular component architecture, and timely delivery.`,
          p.id
        ]);
      }

      // Add members to _assignedstaffprojects if not already present
      for (const m of members) {
        if (m) {
          try {
            await queryDb("INSERT IGNORE INTO _assignedstaffprojects (A, B) VALUES (?, ?)", [p.id, m.id]);
          } catch {}
        }
      }
      if (leader) {
        try {
          await queryDb("INSERT IGNORE INTO _assignedstaffprojects (A, B) VALUES (?, ?)", [p.id, leader.id]);
        } catch {}
      }
    }

    // Populate section on existing tasks if empty
    const tasks = await queryDb("SELECT id, title, section FROM task");
    for (const t of tasks) {
      if (!t.section) {
        let sec = "General";
        const titleLower = t.title.toLowerCase();
        if (titleLower.includes("ui") || titleLower.includes("design") || titleLower.includes("frontend")) sec = "Frontend";
        else if (titleLower.includes("api") || titleLower.includes("auth") || titleLower.includes("backend")) sec = "Backend";
        else if (titleLower.includes("db") || titleLower.includes("database") || titleLower.includes("pool") || titleLower.includes("tidb")) sec = "Database";
        else if (titleLower.includes("test") || titleLower.includes("audit") || titleLower.includes("qa")) sec = "Testing";
        else if (titleLower.includes("ci/cd") || titleLower.includes("aws") || titleLower.includes("docker") || titleLower.includes("cloud")) sec = "Deployment";
        else if (titleLower.includes("seo") || titleLower.includes("marketing")) sec = "SEO & Marketing";
        else if (titleLower.includes("payroll") || titleLower.includes("finance") || titleLower.includes("tax")) sec = "Finance & Tax";

        await queryDb("UPDATE task SET section = ? WHERE id = ?", [sec, t.id]);
      }
    }

    console.log("✓ Successfully upgraded database schema and backfilled project team leaders, members, and task sections!");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

updateSchemaAndData();
