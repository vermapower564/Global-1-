const axios = require("axios");

async function checkCols() {
  const BASE = "http://localhost:3000";
  const loginRes = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

  const projectsRes = await axios.get(`${BASE}/api/projects`, {
    headers: { Cookie: cookie },
  });

  const tasksRes = await axios.get(`${BASE}/api/tasks`, {
    headers: { Cookie: cookie },
  });

  console.log("Sample Project:", JSON.stringify(projectsRes.data.projects?.[0] || projectsRes.data, null, 2));
  console.log("Sample Task:", JSON.stringify(tasksRes.data.tasks?.[0] || tasksRes.data, null, 2));
}

checkCols().catch(console.error);
