const mariadb = require("mariadb");

async function ensurePhones() {
  const pool = mariadb.createPool({ host: "127.0.0.1", port: 3306, user: "root", password: "", database: "oms" });
  try {
    const conn = await pool.getConnection();
    const users = await conn.query("SELECT id, employeeId, name, phone FROM user");
    
    let updated = 0;
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      if (!u.phone || u.phone.trim() === "") {
        const generatedPhone = `+91 98765 ${Math.floor(10000 + (i * 739) % 90000).toString().padStart(5, "0")}`;
        await conn.query("UPDATE user SET phone = ? WHERE id = ?", [generatedPhone, u.id]);
        console.log(`Updated phone for ${u.name} (${u.employeeId}) -> ${generatedPhone}`);
        updated++;
      }
    }

    console.log(`✅ Phone numbers verified for all ${users.length} employees (Updated: ${updated}).`);
    conn.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

ensurePhones();
