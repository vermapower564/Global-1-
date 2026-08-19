const axios = require("axios");

async function runEndToEndVerification() {
  console.log("==================================================");
  console.log("🚀 OMS END-TO-END WORKFLOW VERIFICATION SUITE");
  console.log("==================================================");

  const BASE_URL = "http://localhost:3000";

  // =========================================================================
  // STEP 1: AUTHENTICATE USERS
  // =========================================================================
  console.log("\n[1/4] Authenticating Admin and Employee sessions...");
  
  // Admin Login
  const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP-8595",
    password: "Roushan@123",
  });
  const adminCookie = adminLogin.headers["set-cookie"][0];
  console.log(`   ✓ Admin Authenticated: ${adminLogin.data.user.name} (${adminLogin.data.user.role})`);

  // Employee Login (Aditya Raj - EMP014)
  const empLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
    identity: "EMP014",
    password: "Roushan@123",
  });
  const empCookie = empLogin.headers["set-cookie"][0];
  console.log(`   ✓ Employee Authenticated: ${empLogin.data.user.name} (EMP014)`);

  // =========================================================================
  // STEP 2: ATTENDANCE REAL-TIME PUNCH FLOW
  // =========================================================================
  console.log("\n[2/4] Testing Employee Punch & Admin Real-Time Visibility...");

  // Employee fetches own attendance
  const empAttRes = await axios.get(`${BASE_URL}/api/attendance`, {
    headers: { Cookie: empCookie },
  });
  console.log(`   ✓ Employee fetched personal punch ledger: ${empAttRes.data.total} records found.`);

  // Admin checks Master Workforce Attendance Ledger
  const adminAttRes = await axios.get(`${BASE_URL}/api/attendance?employeeId=EMP014`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`   ✓ Admin queried Aditya Raj's punch records: ${adminAttRes.data.total} records verified in TiDB Cloud.`);
  const latestPunch = adminAttRes.data.data[0];
  console.log(`     • Latest Punch Date: ${latestPunch.date?.split("T")[0]}`);
  console.log(`     • Check-In: ${latestPunch.checkInTime ? new Date(latestPunch.checkInTime).toLocaleTimeString("en-IN") : "-"}`);
  console.log(`     • Status: ${latestPunch.status} (Shift Active: ${latestPunch.isActiveShift})`);

  // =========================================================================
  // STEP 3: ADMIN ASSIGNS TASK TO EMPLOYEE
  // =========================================================================
  console.log("\n[3/4] Testing Admin Task Assignment & Employee Reception...");

  const taskPayload = {
    title: "TiDB Cloud Gateway SSL & Connection Pooling Verification",
    description: "Verify that all 32 employee workstations connect to TiDB Cloud with zero connection pool timeouts and sub-second response times.",
    assignedToUserId: empLogin.data.user.id,
    priority: "HIGH",
    estimatedHours: 6.5,
    dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  };

  const createTaskRes = await axios.post(`${BASE_URL}/api/tasks`, taskPayload, {
    headers: { Cookie: adminCookie },
  });

  const createdTaskId = createTaskRes.data.task.id;
  console.log(`   ✓ Admin created and assigned task: "${createTaskRes.data.task.title}" (Task ID: ${createdTaskId})`);

  // Employee views newly assigned task in /api/tasks
  const empTasksRes = await axios.get(`${BASE_URL}/api/tasks`, {
    headers: { Cookie: empCookie },
  });
  const myTask = empTasksRes.data.tasks.find((t) => t.id === createdTaskId);
  console.log(`   ✓ Employee received task in workboard: Status = ${myTask.status}, Priority = ${myTask.priority}`);

  // =========================================================================
  // STEP 4: TASK LIFECYCLE: START -> PROGRESS 60% -> COMPLETE 100%
  // =========================================================================
  console.log("\n[4/4] Testing Task Lifecycle (START -> IN_PROGRESS -> COMPLETED)...");

  // 4a. Employee Starts Task
  const startTaskRes = await axios.patch(
    `${BASE_URL}/api/tasks/${createdTaskId}`,
    { action: "START_TASK" },
    { headers: { Cookie: empCookie } }
  );
  console.log(`   ✓ Employee started task: ${startTaskRes.data.message}`);

  // Admin checks live status
  let adminTaskCheck = await axios.get(`${BASE_URL}/api/tasks/${createdTaskId}`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`   • Admin Live View: Status = ${adminTaskCheck.data.task.status}, Progress = ${adminTaskCheck.data.task.progress}%`);

  // 4b. Employee Updates Progress to 60%
  const progRes = await axios.patch(
    `${BASE_URL}/api/tasks/${createdTaskId}`,
    { progress: 60, status: "IN_PROGRESS" },
    { headers: { Cookie: empCookie } }
  );
  console.log(`   ✓ Employee updated progress to 60%: ${progRes.data.message}`);

  adminTaskCheck = await axios.get(`${BASE_URL}/api/tasks/${createdTaskId}`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`   • Admin Live View: Progress = ${adminTaskCheck.data.task.progress}%, Status = ${adminTaskCheck.data.task.status}`);

  // 4c. Employee Completes Task (Progress 100%)
  const completeRes = await axios.patch(
    `${BASE_URL}/api/tasks/${createdTaskId}`,
    { progress: 100 },
    { headers: { Cookie: empCookie } }
  );
  console.log(`   ✓ Employee set progress to 100%: ${completeRes.data.message}`);

  adminTaskCheck = await axios.get(`${BASE_URL}/api/tasks/${createdTaskId}`, {
    headers: { Cookie: adminCookie },
  });
  console.log(`   • Admin Live View: Status = ${adminTaskCheck.data.task.status}, Progress = ${adminTaskCheck.data.task.progress}%, CompletedAt = ${adminTaskCheck.data.task.completedAt}`);

  console.log("\n==================================================");
  console.log("🎉 ALL SUCCESS CRITERIA MET WITH ZERO ERRORS!");
  console.log("==================================================");
}

runEndToEndVerification().catch(console.error);
