require("dotenv").config();
const mysql = require("mysql2/promise");

async function modifyUserRoleColumn() {
  const url = process.env.DATABASE_URL;
  const connection = await mysql.createConnection({
    uri: url,
    ssl: { rejectUnauthorized: true },
  });

  console.log("Connected to TiDB Cloud.");

  try {
    await connection.execute(`ALTER TABLE user MODIFY COLUMN role VARCHAR(64) NOT NULL DEFAULT 'DEVELOPER'`);
    console.log("✓ Successfully modified user.role to VARCHAR(64)");
  } catch (err) {
    console.error("Failed modifying column:", err);
  }

  await connection.end();
}

modifyUserRoleColumn().then(() => process.exit(0)).catch(() => process.exit(1));
