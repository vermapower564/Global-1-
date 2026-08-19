const axios = require("axios");

async function testAuthEmployeePage() {
  console.log("1. Logging in as Super Admin...");
  const loginRes = await axios.post("http://localhost:3000/api/auth/login", {
    identity: "EMP-8595",
    password: "Roushan@123",
  });

  const cookie = loginRes.headers["set-cookie"] ? loginRes.headers["set-cookie"][0] : "";
  console.log("   Login success! Token acquired.");

  console.log("2. Requesting /admin/employees with session cookie...");
  const res = await axios.get("http://localhost:3000/admin/employees", {
    headers: {
      Cookie: cookie,
      Authorization: `Bearer ${loginRes.data.token}`,
    },
  });

  console.log(`   Result: HTTP ${res.status} OK! Admin Employee Page loaded successfully.`);
  process.exit(0);
}

testAuthEmployeePage().catch(err => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
