const mysql = require("mysql2/promise");

async function seedAttendancePunches() {
  console.log("==================================================");
  console.log("🕒 Seeding Master Attendance Punch Records in TiDB Cloud");
  console.log("==================================================");

  const conn = await mysql.createConnection({
    host: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
    port: 4000,
    user: "4BrXAABTf5SQeKq.root",
    password: "oF5rWQth8eQANTqp",
    database: "oms",
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  });

  const [users] = await conn.query("SELECT id, employeeId, name, role FROM user;");
  console.log(`Found ${users.length} employees to generate attendance punches for.`);

  const today = new Date();

  // Create punches for today (some checked-in active, some completed) and past 3 days
  for (const u of users) {
    // 1. Past 3 days (Completed standard 8.5 to 9.0 hr shifts)
    for (let d = 3; d >= 1; d--) {
      const shiftDate = new Date(today.getTime() - d * 24 * 3600 * 1000);
      const shiftDateStr = shiftDate.toISOString().split("T")[0];

      const checkIn = new Date(shiftDate);
      checkIn.setHours(9, Math.floor(Math.random() * 25), 0, 0); // 9:00 - 9:25 AM

      const checkOut = new Date(shiftDate);
      checkOut.setHours(17, 30 + Math.floor(Math.random() * 30), 0, 0); // 5:30 - 6:00 PM

      const hoursWorked = Math.round(((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600)) * 10) / 10;
      const attId = `ATT-${u.employeeId || u.id}-${shiftDateStr}`;

      await conn.query(
        `INSERT INTO attendance (id, userId, date, checkInTime, checkOutTime, hoursWorked, status, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, 'PRESENT', NOW())
         ON DUPLICATE KEY UPDATE
           checkInTime = VALUES(checkInTime),
           checkOutTime = VALUES(checkOutTime),
           hoursWorked = VALUES(hoursWorked),
           status = 'PRESENT'`,
        [attId, u.id, shiftDate, checkIn, checkOut, hoursWorked]
      );
    }

    // 2. Today's Punch (Day 0):
    const todayShift = new Date(today);
    const todayStr = todayShift.toISOString().split("T")[0];
    const todayAttId = `ATT-${u.employeeId || u.id}-${todayStr}`;

    const checkInToday = new Date(today);
    checkInToday.setHours(9, Math.floor(Math.random() * 20), 0, 0);

    // 60% are currently in active shift (checkOutTime = NULL), 40% have checked out
    const isCompleted = Math.random() > 0.6;
    let checkOutToday = null;
    let hoursToday = 0;

    if (isCompleted) {
      checkOutToday = new Date(today);
      checkOutToday.setHours(17, 30 + Math.floor(Math.random() * 20), 0, 0);
      hoursToday = Math.round(((checkOutToday.getTime() - checkInToday.getTime()) / (1000 * 3600)) * 10) / 10;
    }

    await conn.query(
      `INSERT INTO attendance (id, userId, date, checkInTime, checkOutTime, hoursWorked, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, 'PRESENT', NOW())
       ON DUPLICATE KEY UPDATE
         checkInTime = VALUES(checkInTime),
         checkOutTime = VALUES(checkOutTime),
         hoursWorked = VALUES(hoursWorked),
         status = 'PRESENT'`,
      [todayAttId, u.id, todayShift, checkInToday, checkOutToday, hoursToday]
    );

    console.log(`✅ Seeded Punches for: ${u.name} (${u.employeeId}) -> Today: ${isCompleted ? 'Completed (' + hoursToday + ' hrs)' : '🟢 Active Shift'}`);
  }

  const [totalRes] = await conn.query("SELECT COUNT(*) as count FROM attendance;");
  console.log(`\n🎉 Attendance Seeding Complete! Total Punches in TiDB Cloud: ${totalRes[0].count}`);
  await conn.end();
}

seedAttendancePunches().catch(console.error);
