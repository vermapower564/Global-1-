const axios = require("axios");

async function testVariousLogins() {
  const credentials = [
    { identity: "EMP-8595", password: "Roushan@123" },
    { identity: "EMP014", password: "Roushan@123" },
    { identity: "priya.sharma@gmail.com", password: "Roushan@123" },
  ];

  for (const cred of credentials) {
    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", cred);
      console.log(`✅ [${res.status}] Login successful for "${cred.identity}": User=${res.data.user.name} (${res.data.user.role}) -> Redirect: ${res.data.redirectTo}`);
    } catch (err) {
      console.log(`❌ Login failed for "${cred.identity}":`, err.response ? err.response.data : err.message);
    }
  }
}

testVariousLogins();
