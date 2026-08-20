const axios = require("axios");

async function fetchProjectWorkDetails() {
  const BASE = "http://localhost:3000";

  // Login as Admin to fetch full work and task records
  const loginRes = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

  const tasksRes = await axios.get(`${BASE}/api/tasks`, {
    headers: { Cookie: cookie },
  });

  const dailyWorkRes = await axios.get(`${BASE}/api/daily-work`, {
    headers: { Cookie: cookie },
  });

  const employeesRes = await axios.get(`${BASE}/api/employees`, {
    headers: { Cookie: cookie },
  });

  console.log("=== EMPLOYEES ===");
  console.log(JSON.stringify(employeesRes.data.employees?.slice(0, 8), null, 2));

  console.log("=== TASKS ===");
  console.log(JSON.stringify(tasksRes.data.tasks?.slice(0, 8), null, 2));

  console.log("=== DAILY WORK UPDATES ===");
  console.log(JSON.stringify(dailyWorkRes.data.updates?.slice(0, 8), null, 2));
}

fetchProjectWorkDetails().catch(console.error);
