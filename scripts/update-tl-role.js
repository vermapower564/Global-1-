const axios = require("axios");

async function updateTLRole() {
  const adminLogin = await axios.post("http://localhost:3000/api/auth/login", {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"][0].split(";")[0];

  const res = await axios.patch(
    "http://localhost:3000/api/admin/employees/EMP-7592",
    { role: "DEVELOPER" },
    { headers: { Cookie: adminCookie } }
  );

  console.log("Update result:", res.data);
}

updateTLRole().catch(console.error);
