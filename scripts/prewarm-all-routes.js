const axios = require("axios");

const BASE_URL = "http://localhost:3000";

const routesToWarm = [
  "/",
  "/auth/login",
  "/login",
  "/auth/forgot-password",
  "/feedback/EMP-8595",
  "/employee/dashboard",
  "/employee/tasks",
  "/employee/projects",
  "/employee/attendance",
  "/employee/work",
  "/employee/reviews",
  "/employee/feedback",
  "/employee/team",
  "/employee/reports",
  "/employee/profile",
  "/admin/dashboard",
  "/admin/employees",
  "/admin/tasks",
  "/admin/projects",
  "/admin/blockers",
  "/admin/attendance",
  "/admin/work",
  "/admin/reviews",
  "/admin/reports",
  "/api/reviews",
  "/api/employees",
];

async function warmUpAllRoutes() {
  console.log("⚡ Pre-warming all application routes for ultra-fast response times...\n");

  const startTime = Date.now();
  let completed = 0;

  for (const route of routesToWarm) {
    try {
      const t0 = Date.now();
      const res = await axios.get(`${BASE_URL}${route}`, {
        validateStatus: () => true,
        timeout: 8000,
      });
      const elapsed = Date.now() - t0;
      console.log(`⚡ [HTTP ${res.status}] ${route.padEnd(28)} in ${elapsed}ms`);
      completed++;
    } catch (err) {
      console.log(`⚠️ Route ${route} warm-up note: ${err.message}`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 Pre-warming Complete! ${completed}/${routesToWarm.length} routes compiled & hot in memory in ${totalTime}s.`);
}

warmUpAllRoutes();
