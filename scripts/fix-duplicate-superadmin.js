const axios = require("axios");

async function fixDuplicateSuperAdmin() {
  const adminLogin = await axios.post("http://localhost:3000/api/auth/login", {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"][0].split(";")[0];

  const res = await axios.patch(
    "http://localhost:3000/api/admin/employees/EMP001",
    { role: "HR" },
    { headers: { Cookie: adminCookie } }
  );

  console.log("Updated EMP001 role to HR:", res.data);
}

fixDuplicateSuperAdmin().catch(console.error);
