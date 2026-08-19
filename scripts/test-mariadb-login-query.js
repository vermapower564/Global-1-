const mariadb = require("mariadb");

async function testQuery() {
  const pool = mariadb.createPool({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "oms",
  });

  try {
    const conn = await pool.getConnection();
    const cleanIdentity = "roushan.verma@gmail.com";
    const cleanLower = cleanIdentity.toLowerCase();
    const cleanUpper = cleanIdentity.toUpperCase();

    const rows = await conn.query(
      `SELECT u.*, d.name AS departmentName 
       FROM user u 
       LEFT JOIN department d ON u.departmentId = d.id 
       WHERE LOWER(u.email) = ? OR u.employeeId = ? OR u.employeeId = ? OR u.employeeId = ?
       LIMIT 1`,
      [cleanLower, cleanIdentity, cleanUpper, cleanLower]
    );

    console.log("Direct MariaDB User Query Result:", rows.length > 0 ? rows[0].name : "Not Found");
    conn.release();
    await pool.end();
  } catch (err) {
    console.error("Query Error:", err);
  }
}

testQuery();
