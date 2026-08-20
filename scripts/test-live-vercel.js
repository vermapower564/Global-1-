const axios = require("axios");

async function testVercel() {
  const BASE = "https://gwebify-26.vercel.app";
  console.log("Testing Live Vercel Deployment:", BASE);
  console.log("--------------------------------------------------");

  // 1. Root
  const r1 = await axios.get(BASE, { maxRedirects: 0, validateStatus: () => true });
  console.log("1. GET / (Unauthenticated)");
  console.log("   Status:", r1.status, "| Location:", r1.headers.location);

  // 2. Direct /employee
  const r2 = await axios.get(BASE + "/employee", { maxRedirects: 0, validateStatus: () => true });
  console.log("2. GET /employee (Unauthenticated)");
  console.log("   Status:", r2.status, "| Location:", r2.headers.location);

  // 3. Direct /admin
  const r3 = await axios.get(BASE + "/admin", { maxRedirects: 0, validateStatus: () => true });
  console.log("3. GET /admin (Unauthenticated)");
  console.log("   Status:", r3.status, "| Location:", r3.headers.location);

  // 4. Invalid Login
  const r4 = await axios.post(BASE + "/api/auth/login", { identity: "WRONG", password: "WRONG" }, { validateStatus: () => true });
  console.log("4. POST /api/auth/login (Invalid Credentials)");
  console.log("   Status:", r4.status, "| Error Message:", r4.data.error);

  // 5. Valid Admin Login
  const r5 = await axios.post(BASE + "/api/auth/login", { identity: "EMP-8595", password: "Roushan@123" }, { validateStatus: () => true });
  console.log("5. POST /api/auth/login (Admin EMP-8595)");
  console.log("   Status:", r5.status, "| RedirectTo:", r5.data.redirectTo, "| Role:", r5.data.user?.role);

  // 6. Valid Employee Login
  const r6 = await axios.post(BASE + "/api/auth/login", { identity: "EMP014", password: "Roushan@123" }, { validateStatus: () => true });
  console.log("6. POST /api/auth/login (Employee EMP014)");
  console.log("   Status:", r6.status, "| RedirectTo:", r6.data.redirectTo, "| Role:", r6.data.user?.role);

  console.log("--------------------------------------------------");
  console.log("All live production verification checks completed!");
}

testVercel();
