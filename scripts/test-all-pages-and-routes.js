const axios = require("axios");

const BASE = "http://localhost:3000";

async function testAllRoutes() {
  console.log("==================================================");
  console.log("  TESTING ALL MAIN PAGES & API ROUTES");
  console.log("==================================================\n");

  // 1. Unauthenticated test
  const publicPages = ["/login", "/forget-password"];
  for (const page of publicPages) {
    try {
      const res = await axios.get(`${BASE}${page}`);
      console.log(`✓ Public Page [${page}]: Status ${res.status}`);
    } catch (e) {
      console.error(`✗ Public Page [${page}]: Error ${e.response?.status || e.message}`);
    }
  }

  // 2. Authenticate as Super Admin
  const adminLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"][0].split(";")[0];

  const adminPages = [
    "/admin/dashboard",
    "/admin/employees",
    "/admin/projects",
    "/admin/tasks",
    "/admin/today",
    "/admin/work",
    "/admin/attendance",
    "/admin/salary-slips",
    "/admin/reports",
    "/admin/reviews",
    "/admin/audit-logs",
    "/admin/project-managers",
    "/admin/organisation",
    "/employees/add",
  ];

  console.log("\n--- ADMIN PAGES (SUPER ADMIN) ---");
  for (const page of adminPages) {
    try {
      const res = await axios.get(`${BASE}${page}`, { headers: { Cookie: adminCookie } });
      console.log(`✓ Admin Page [${page}]: Status ${res.status}`);
    } catch (e) {
      console.error(`✗ Admin Page [${page}]: Error ${e.response?.status || e.message}`);
    }
  }

  // 3. Authenticate as Project Manager
  const pmLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8222",
    password: "Roushan@123",
  });
  const pmCookie = pmLogin.headers["set-cookie"][0].split(";")[0];

  const pmPages = [
    "/project-manager",
    "/project-manager/create-project",
    "/project-manager/team-leaders",
    "/project-manager/performance",
    "/project-manager/promotions",
    "/project-manager/reports",
    "/project-manager/tasks",
    "/project-manager/progress",
    "/project-manager/assign-work",
  ];

  console.log("\n--- PROJECT MANAGER PAGES ---");
  for (const page of pmPages) {
    try {
      const res = await axios.get(`${BASE}${page}`, { headers: { Cookie: pmCookie } });
      console.log(`✓ PM Page [${page}]: Status ${res.status}`);
    } catch (e) {
      console.error(`✗ PM Page [${page}]: Error ${e.response?.status || e.message}`);
    }
  }

  // 4. Authenticate as Team Leader
  const tlLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-7592",
    password: "Roushan@123",
  });
  const tlCookie = tlLogin.headers["set-cookie"][0].split(";")[0];

  const tlPages = [
    "/team-leader",
    "/team-leader/tasks",
    "/team-leader/progress",
    "/team-leader/team",
    "/team-leader/assign-work",
    "/team-leader/reviews",
  ];

  console.log("\n--- TEAM LEADER PAGES ---");
  for (const page of tlPages) {
    try {
      const res = await axios.get(`${BASE}${page}`, { headers: { Cookie: tlCookie } });
      console.log(`✓ TL Page [${page}]: Status ${res.status}`);
    } catch (e) {
      console.error(`✗ TL Page [${page}]: Error ${e.response?.status || e.message}`);
    }
  }

  // 5. Authenticate as Employee
  const empLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-6841",
    password: "Roushan@123",
  });
  const empCookie = empLogin.headers["set-cookie"][0].split(";")[0];

  const empPages = [
    "/employee/dashboard",
    "/employee/profile",
    "/employee/projects",
    "/employee/tasks",
    "/employee/work",
    "/employee/attendance",
    "/employee/reviews",
    "/employee/team",
  ];

  console.log("\n--- EMPLOYEE PAGES ---");
  for (const page of empPages) {
    try {
      const res = await axios.get(`${BASE}${page}`, { headers: { Cookie: empCookie } });
      console.log(`✓ Employee Page [${page}]: Status ${res.status}`);
    } catch (e) {
      console.error(`✗ Employee Page [${page}]: Error ${e.response?.status || e.message}`);
    }
  }

  console.log("\n==================================================");
  console.log("  TEST COMPLETE");
  console.log("==================================================");
}

testAllRoutes().catch(console.error);
