const mariadb = require("mariadb");
const bcrypt = require("bcryptjs");

async function verifyAll() {
  const targetPassword = process.argv[2] || "Roushan@123";
  const pool = mariadb.createPool({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "oms",
  });

  try {
    const conn = await pool.getConnection();
    const users = await conn.query("SELECT id, employeeId, name, email, role, password FROM user");
    console.log(`Verifying ${users.length} users against password "${targetPassword}"...`);

    let passed = 0;
    let failed = 0;

    for (const u of users) {
      const match = await bcrypt.compare(targetPassword, u.password);
      if (match) {
        passed++;
      } else {
        failed++;
        console.error(`❌ Verification failed for ${u.email}`);
      }
    }

    console.log(`\nVerification Result: ${passed}/${users.length} PASSED. (Failed: ${failed})`);
    conn.release();
    await pool.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

verifyAll();
