async function testLiveServer() {
  console.log("🌐 Testing live Next.js application server at http://127.0.0.1:3000...");

  try {
    const resAuth = await fetch("http://127.0.0.1:3000/api/auth/me");
    console.log(`📡 GET http://127.0.0.1:3000/api/auth/me Response Status: ${resAuth.status}`);

    const resEmps = await fetch("http://127.0.0.1:3000/api/employees");
    const jsonEmps = await resEmps.json();
    console.log(`📡 GET http://127.0.0.1:3000/api/employees Response Status: ${resEmps.status} | Total Employees: ${jsonEmps.total || 0}`);

    console.log("🎉 SUCCESS! Live web application server is up and serving requests cleanly!");
  } catch (err: any) {
    console.error("❌ Live Server Error:", err.message);
  }
}

testLiveServer();
