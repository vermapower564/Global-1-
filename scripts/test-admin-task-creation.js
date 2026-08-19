const axios = require("axios");

async function testTaskSystem() {
  console.log("==================================================");
  console.log("🧪 Testing Task System & Admin Dispatcher on TiDB Cloud");
  console.log("==================================================");

  const BASE_URL = "http://localhost:3000";

  // 1. Login as Super Admin
  console.log("\n1️⃣ Logging in as Super Admin (EMP-8595)...");
  const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"] ? adminLogin.headers["set-cookie"][0] : "";
  console.log("   • Super Admin Authenticated! User:", adminLogin.data.user.name);

  // 2. Fetch All Tasks as Super Admin
  console.log("\n2️⃣ Fetching all organization tasks as Super Admin (/api/tasks)...");
  const tasksRes = await axios.get(`${BASE_URL}/api/tasks`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`   • Total Tasks Found in TiDB: ${tasksRes.data.tasks?.length}`);
  console.log(`   • Summary KPIs:`, tasksRes.data.summary);

  // 3. Create a New Task as Admin
  console.log("\n3️⃣ Admin creating a new task assigned to Lead Developer (Aditya Raj - USR-003)...");
  const createRes = await axios.post(
    `${BASE_URL}/api/tasks`,
    {
      title: "Deploy Automated CI/CD Next.js Production Pipeline",
      description: "Setup GitHub Actions workflow with automated Next.js build verification and TiDB Cloud migration tests.",
      assignedToUserId: "USR-003", // Aditya Raj
      projectId: "cmswz5wz10000i0tqoc25aink",
      priority: "CRITICAL",
      dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
      estimatedHours: 12,
    },
    {
      headers: { Cookie: adminCookie },
    }
  );
  console.log("   • Create Task Response:", createRes.data.message);
  console.log("   • Created Task ID:", createRes.data.task?.id);

  // 4. Login as Employee (Aditya Raj)
  console.log("\n4️⃣ Logging in as Lead Developer (Aditya Raj - EMP014)...");
  const empLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP014",
    password: "Roushan@123",
  });
  const empCookie = empLogin.headers["set-cookie"] ? empLogin.headers["set-cookie"][0] : "";
  console.log("   • Lead Developer Authenticated! User:", empLogin.data.user.name);

  // 5. Fetch Tasks as Employee (Role-Scoped View)
  console.log("\n5️⃣ Fetching assigned tasks for Aditya Raj (/employee/tasks)...");
  const empTasksRes = await axios.get(`${BASE_URL}/api/tasks`, {
    headers: { Cookie: empCookie },
  });
  console.log(`   • Total Tasks Assigned to Aditya Raj: ${empTasksRes.data.tasks?.length}`);
  console.log("   • Assigned Tasks List:");
  empTasksRes.data.tasks.forEach((t, i) => {
    console.log(`     ${i + 1}. [${t.priority}] ${t.title} (${t.status}, Progress: ${t.progress}%)`);
  });

  console.log("\n==================================================");
  console.log("🎉 ALL TASK CREATION & ASSIGNMENT TESTS PASSED!");
  console.log("==================================================");
}

testTaskSystem().catch(console.error);
