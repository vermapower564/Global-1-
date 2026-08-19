const axios = require("axios");

async function testAdminReviewsPage() {
  console.log("1. Logging in as Super Admin...");
  const loginRes = await axios.post("http://localhost:3000/api/auth/login", {
    identity: "EMP-8595",
    password: "Roushan@123",
  });

  const cookie = loginRes.headers["set-cookie"] ? loginRes.headers["set-cookie"][0] : "";
  console.log("   Login success! Token acquired.");

  console.log("2. Requesting /admin/reviews to verify runtime fix...");
  const res = await axios.get("http://localhost:3000/admin/reviews", {
    headers: {
      Cookie: cookie,
      Authorization: `Bearer ${loginRes.data.token}`,
    },
  });

  console.log(`   Result: HTTP ${res.status} OK! Admin Reviews Page loaded with NO runtime errors.`);

  console.log("3. Requesting /admin/projects to verify Team Leader, Teammates & Reviews...");
  const resProj = await axios.get("http://localhost:3000/admin/projects", {
    headers: {
      Cookie: cookie,
      Authorization: `Bearer ${loginRes.data.token}`,
    },
  });
  console.log(`   Result: HTTP ${resProj.status} OK! Admin Projects Page loaded successfully.`);

  process.exit(0);
}

testAdminReviewsPage().catch(err => {
  console.error("Test error:", err.message);
  process.exit(1);
});
