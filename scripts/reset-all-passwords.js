const mariadb = require("mariadb");
const bcrypt = require("bcryptjs");

async function resetAllPasswords() {
  const newPassword = process.argv[2] || "password123";
  console.log(`🔐 Resetting all user passwords in MariaDB/MySQL database to: "${newPassword}"...`);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  const pool = mariadb.createPool({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "oms",
    connectTimeout: 5000,
  });

  try {
    const conn = await pool.getConnection();
    console.log("✅ Connected to MySQL/MariaDB database 'oms' at 127.0.0.1:3306!");

    const users = await conn.query("SELECT id, employeeId, name, email, role FROM user");
    console.log(`Found ${users.length} user(s) in the database:`);

    for (const u of users) {
      console.log(` - [${u.employeeId || "NO-ID"}] ${u.name} (${u.email}) [${u.role}]`);
    }

    const updateRes = await conn.query("UPDATE user SET password = ?", [hashedPassword]);
    console.log(`\n✅ Successfully updated database password hash for all ${users.length} accounts!`);
    console.log(`🔑 New Password for all accounts: "${newPassword}"`);

    // Verify one user password match
    const verifyUser = await conn.query("SELECT email, password FROM user LIMIT 1");
    if (verifyUser.length > 0) {
      const match = await bcrypt.compare(newPassword, verifyUser[0].password);
      console.log(`🧪 Bcrypt Hash Verification Test: ${match ? "PASSED (Password matches hash)" : "FAILED"}`);
    }

    conn.release();
    await pool.end();
  } catch (err) {
    console.error("❌ Database Error:", err.message);
  }
}

resetAllPasswords();
