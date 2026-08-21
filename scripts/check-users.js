const axios = require("axios");

const BASE = "http://localhost:3000";

async function testRoles() {
  const adminLogin = await axios.post(`${BASE}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"][0].split(";")[0];
  const empRes = await axios.get(`${BASE}/api/employees`, {
    headers: { Cookie: adminCookie },
  });
  console.log("All Employees in DB:");
  const users = (empRes.data.employees || empRes.data.data || []).map(e => ({
    id: e.id,
    empId: e.employeeId,
    name: e.name,
    role: e.role,
  }));
  console.table(users);
}

testRoles().catch(console.error);
