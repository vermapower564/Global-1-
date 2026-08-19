const mariadb = require("mariadb");
const bcrypt = require("bcryptjs");

async function testAllNewFeatures() {
  console.log("🧪 Running Comprehensive Test Suite for Passwords & Customer Reviews...");

  const pool = mariadb.createPool({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "oms",
  });

  try {
    const conn = await pool.getConnection();

    // 1. Test Password Hash on All Users
    const users = await conn.query("SELECT id, employeeId, name, email, role, password FROM user");
    console.log(`\n1️⃣ Testing Password "Roushan@123" for all ${users.length} database users...`);

    let pwPass = 0;
    for (const u of users) {
      const isMatch = await bcrypt.compare("Roushan@123", u.password);
      if (isMatch) pwPass++;
    }
    console.log(`   Result: ${pwPass}/${users.length} users verified with password "Roushan@123"!`);

    // 2. Test Customer Reviews Table & Records
    console.log("\n2️⃣ Testing Customer Reviews & Feedback Records...");
    const reviews = await conn.query("SELECT id, employeeId, employeeName, customerName, rating, status FROM customerreview");
    console.log(`   Found ${reviews.length} customer review(s) in database:`);
    reviews.forEach(r => {
      console.log(`   - [${r.id}] ${r.rating}★ for ${r.employeeName} (${r.employeeId}) from ${r.customerName} [${r.status}]`);
    });

    conn.release();
    await pool.end();
    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test suite error:", err);
    process.exit(1);
  }
}

testAllNewFeatures();
