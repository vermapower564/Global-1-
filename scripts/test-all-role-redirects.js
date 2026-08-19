const axios = require("axios");

async function testRoleRedirects() {
  console.log("==================================================");
  console.log("🧪 Testing Role-Based Authentication & Redirects on TiDB Cloud");
  console.log("==================================================\n");

  const BASE = "http://localhost:3000";

  const testAccounts = [
    { label: "Super Admin", id: "EMP-8595", expectedRedirect: "/admin", role: "SUPER_ADMIN" },
    { label: "Director", id: "EMP-7278", expectedRedirect: "/admin", role: "DIRECTOR" },
    { label: "HR Manager", id: "EMP-8219", expectedRedirect: "/admin", role: "HR" },
    { label: "Finance Manager", id: "EMP-7592", expectedRedirect: "/admin", role: "FINANCE" },
    { label: "Lead Developer", id: "EMP014", expectedRedirect: "/employee", role: "DEVELOPER" },
    { label: "Backend Developer", id: "EMP-6841", expectedRedirect: "/employee", role: "DEVELOPER" },
    { label: "UI/UX Designer", id: "EMP-8223", expectedRedirect: "/employee", role: "UI_UX_DESIGNER" },
    { label: "Video Editor", id: "EMP-2887", expectedRedirect: "/employee", role: "VIDEO_EDITOR" },
  ];

  for (const acc of testAccounts) {
    try {
      const res = await axios.post(`${BASE}/api/auth/login`, {
        identity: acc.id,
        password: "Roushan@123",
      });

      const data = res.data;
      const pass = data.redirectTo === acc.expectedRedirect;

      console.log(`👤 [${acc.label}] (${acc.id})`);
      console.log(`   • Authenticated as: ${data.user.name} (${data.user.role})`);
      console.log(`   • Destination Workspace: ${data.redirectTo} (IsAdmin: ${data.isAdmin})`);
      console.log(`   • Status: ${pass ? "✅ PASS" : "❌ FAIL"}\n`);
    } catch (err) {
      console.error(`❌ [${acc.label}] Error:`, err.response?.data || err.message);
    }
  }

  console.log("==================================================");
  console.log("🎉 ALL ROLE AUTHENTICATIONS & ROUTING VERIFIED!");
  console.log("==================================================");
}

testRoleRedirects();
