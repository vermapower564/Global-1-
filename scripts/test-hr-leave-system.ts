import { generateToken } from "../lib/authService";
import { NextRequest } from "next/server";
import { GET as getLeave, POST as postLeave, PATCH as patchLeave, DELETE as deleteLeave } from "../app/api/leave/route";
import { queryDb } from "../lib/db";

async function testHrLeaveSystem() {
  console.log("========================================================================");
  console.log("  OMS TEST SUITE: HR LEAVE REQUEST & APPROVAL SYSTEM AUDIT");
  console.log("========================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${title}${details ? ` (${details})` : ""}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${title}${details ? ` (${details})` : ""}`);
      failed++;
    }
  }

  // Tokens for different test roles
  const empToken = generateToken({ id: "EMP-6841", email: "rajesh.khanna@global.com", role: "EMPLOYEE" });
  const tlToken = generateToken({ id: "EMP-7592", email: "amit.patel@global.com", role: "TEAM_LEADER" });
  const pmToken = generateToken({ id: "EMP-8222", email: "vikram.singh@global.com", role: "PROJECT_MANAGER" });
  const hrToken = generateToken({ id: "EMP-8595", email: "roushan.verma@global.com", role: "HR" });
  const superAdminToken = generateToken({ id: "EMP-8595", email: "roushan.verma@global.com", role: "SUPER_ADMIN" });

  let empLeaveId = "";
  let tlLeaveId = "";
  let pmLeaveId = "";

  const offset = Math.floor(Math.random() * 20) + 1;

  // TEST 1: Employee submits leave
  console.log("[1] TEST 1: Employee submits leave directly to HR:");
  {
    const req = new NextRequest("http://localhost:3000/api/leave", {
      method: "POST",
      headers: { Authorization: `Bearer ${empToken}`, Cookie: `oms_session=${empToken}` },
      body: JSON.stringify({
        leaveType: "Casual Leave",
        startDate: `2026-11-${String(offset).padStart(2, "0")}`,
        endDate: `2026-11-${String(offset + 2).padStart(2, "0")}`,
        totalDays: 3,
        reason: "Family function in hometown",
      }),
    });
    const res = await postLeave(req);
    const json = await res.json();
    assert(res.status === 201 && json.success, "Employee leave request submitted", json.data?.id);
    assert(json.data?.status === "PENDING", "Leave request initial status is PENDING");
    assert(json.data?.totalDays === 3, "Leave total duration calculated accurately as 3 days");
    empLeaveId = json.data?.id;
  }

  // TEST 2: Team Leader submits leave
  console.log("\n[2] TEST 2: Team Leader submits leave directly to HR:");
  {
    const req = new NextRequest("http://localhost:3000/api/leave", {
      method: "POST",
      headers: { Authorization: `Bearer ${tlToken}`, Cookie: `oms_session=${tlToken}` },
      body: JSON.stringify({
        leaveType: "Sick Leave",
        startDate: `2026-12-${String(offset).padStart(2, "0")}`,
        endDate: `2026-12-${String(offset).padStart(2, "0")}`,
        totalDays: 1,
        reason: "Medical checkup & dentist appointment",
      }),
    });
    const res = await postLeave(req);
    const json = await res.json();
    assert(res.status === 201 && json.success, "Team Leader leave request submitted", json.data?.id);
    tlLeaveId = json.data?.id;
  }

  // TEST 3: Project Manager submits leave
  console.log("\n[3] TEST 3: Project Manager submits leave directly to HR:");
  {
    const req = new NextRequest("http://localhost:3000/api/leave", {
      method: "POST",
      headers: { Authorization: `Bearer ${pmToken}`, Cookie: `oms_session=${pmToken}` },
      body: JSON.stringify({
        leaveType: "Earned / Privilege Leave",
        startDate: `2026-10-${String(offset).padStart(2, "0")}`,
        endDate: `2026-10-${String(offset + 4).padStart(2, "0")}`,
        totalDays: 5,
        reason: "Annual planned vacation",
      }),
    });
    const res = await postLeave(req);
    const json = await res.json();
    assert(res.status === 201 && json.success, "Project Manager leave request submitted", json.data?.id);
    pmLeaveId = json.data?.id;
  }

  // TEST 4: HR opens Leave Requests
  console.log("\n[4] TEST 4: HR opens Leave Requests Inbox:");
  {
    const req = new NextRequest("http://localhost:3000/api/leave?status=PENDING", {
      headers: { Authorization: `Bearer ${hrToken}`, Cookie: `oms_session=${hrToken}` },
    });
    const res = await getLeave(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "HR inbox fetched successfully");
    const foundEmp = (json.data || []).some((l: any) => l.id === empLeaveId);
    const foundTl = (json.data || []).some((l: any) => l.id === tlLeaveId);
    const foundPm = (json.data || []).some((l: any) => l.id === pmLeaveId);
    assert(foundEmp && foundTl && foundPm, "All 3 pending leave requests are visible in HR inbox");
  }

  // TEST 5: HR clicks APPROVE
  console.log("\n[5] TEST 5: HR approves Employee leave request:");
  {
    const req = new NextRequest("http://localhost:3000/api/leave", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${hrToken}`, Cookie: `oms_session=${hrToken}` },
      body: JSON.stringify({
        id: empLeaveId,
        status: "APPROVED",
        hrRemarks: "Approved by HR. Have a good time with family.",
      }),
    });
    const res = await patchLeave(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "HR approval succeeded", json.data?.status);
    assert(json.data?.status === "APPROVED", "Status updated to APPROVED");
  }

  // TEST 6: HR clicks REJECT
  console.log("\n[6] TEST 6: HR rejects PM leave request with explicit remarks:");
  {
    const req = new NextRequest("http://localhost:3000/api/leave", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${hrToken}`, Cookie: `oms_session=${hrToken}` },
      body: JSON.stringify({
        id: pmLeaveId,
        status: "REJECTED",
        hrRemarks: "Critical sprint release scheduled on 22nd Sept. Please reschedule.",
      }),
    });
    const res = await patchLeave(req);
    const json = await res.json();
    assert(res.status === 200 && json.success, "HR rejection succeeded", json.data?.status);
    assert(json.data?.status === "REJECTED", "Status updated to REJECTED");
    assert(json.data?.hrRemarks.includes("Critical sprint release"), "Rejection reason saved");
  }

  // TEST 7: Notifications created
  console.log("\n[7] TEST 7: Requester receives approval/rejection notifications:");
  {
    const notifs = await queryDb<any[]>(
      `SELECT * FROM notification WHERE userId = (SELECT id FROM user WHERE employeeId = 'EMP-6841' OR id = 'EMP-6841' LIMIT 1) ORDER BY createdAt DESC LIMIT 1`
    );
    assert(notifs && notifs.length > 0, "Notification record found for employee");
    assert(
      notifs[0]?.title.includes("Approved") || notifs[0]?.message.includes("APPROVED"),
      "Notification confirms approval to employee",
      notifs[0]?.message
    );
  }

  // TEST 8: Requester sees final status on page refresh / refetch
  console.log("\n[8] TEST 8: Requester sees updated status on refetch:");
  {
    const req = new NextRequest("http://localhost:3000/api/leave", {
      headers: { Authorization: `Bearer ${empToken}`, Cookie: `oms_session=${empToken}` },
    });
    const res = await getLeave(req);
    const json = await res.json();
    const myLeave = (json.data || []).find((l: any) => l.id === empLeaveId);
    assert(myLeave?.status === "APPROVED", "Persistent status is APPROVED in DB");
    assert(myLeave?.hrRemarks.includes("Approved by HR"), "HR remarks visible to employee");
  }

  // TEST 9, 10, 11, 12: Backend RBAC Enforced (Admin, PM, TL, Employee cannot approve)
  console.log("\n[9-12] TESTS 9-12: Backend RBAC Enforcement (Unauthorized roles blocked):");
  {
    // 10. PM attempts to approve
    const pmReq = new NextRequest("http://localhost:3000/api/leave", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${pmToken}`, Cookie: `oms_session=${pmToken}` },
      body: JSON.stringify({ id: tlLeaveId, status: "APPROVED" }),
    });
    const pmRes = await patchLeave(pmReq);
    assert(pmRes.status === 403, "Project Manager approval blocked with 403 Forbidden");

    // 11. TL attempts to approve
    const tlReq = new NextRequest("http://localhost:3000/api/leave", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tlToken}`, Cookie: `oms_session=${tlToken}` },
      body: JSON.stringify({ id: tlLeaveId, status: "APPROVED" }),
    });
    const tlRes = await patchLeave(tlReq);
    assert(tlRes.status === 403, "Team Leader approval blocked with 403 Forbidden");

    // 12. Employee attempts to approve
    const empReq = new NextRequest("http://localhost:3000/api/leave", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${empToken}`, Cookie: `oms_session=${empToken}` },
      body: JSON.stringify({ id: tlLeaveId, status: "APPROVED" }),
    });
    const empRes = await patchLeave(empReq);
    assert(empRes.status === 403, "Employee approval blocked with 403 Forbidden");
  }

  // TEST 13: Double-Action Protection (Already Approved)
  console.log("\n[13] TEST 13: Double-Action Protection (Already Approved cannot be re-approved):");
  {
    const req = new NextRequest("http://localhost:3000/api/leave", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${hrToken}`, Cookie: `oms_session=${hrToken}` },
      body: JSON.stringify({ id: empLeaveId, status: "APPROVED" }),
    });
    const res = await patchLeave(req);
    assert(res.status === 400, "Duplicate approval blocked with 400 Bad Request");
  }

  // TEST 14: Double-Action Protection (Already Rejected)
  console.log("\n[14] TEST 14: Double-Action Protection (Already Rejected cannot be re-rejected):");
  {
    const req = new NextRequest("http://localhost:3000/api/leave", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${hrToken}`, Cookie: `oms_session=${hrToken}` },
      body: JSON.stringify({ id: pmLeaveId, status: "REJECTED" }),
    });
    const res = await patchLeave(req);
    assert(res.status === 400, "Duplicate rejection blocked with 400 Bad Request");
  }

  // TEST 15: Leave balance integrity
  console.log("\n[15] TEST 15: Leave balance does not deduct pending requests:");
  {
    const req = new NextRequest("http://localhost:3000/api/leave", {
      headers: { Authorization: `Bearer ${tlToken}`, Cookie: `oms_session=${tlToken}` },
    });
    const res = await getLeave(req);
    const json = await res.json();
    const bal = json.leaveBalance;
    assert(bal.pendingLeave >= 1, "Pending leave correctly categorized", `${bal.pendingLeave} pending days`);
    assert(
      bal.availableLeave === bal.totalAnnualAllowance - bal.usedLeave,
      "Available leave equals Allowance - Used (Pending is NOT deducted)",
      `Available: ${bal.availableLeave}, Used: ${bal.usedLeave}`
    );
  }

  // TEST 16: Audit Log recording
  console.log("\n[16] TEST 16: Audit Log entries verified:");
  {
    const logs = await queryDb<any[]>(
      `SELECT * FROM auditlog WHERE action IN ('LEAVE_REQUEST_CREATED', 'LEAVE_REQUEST_APPROVED', 'LEAVE_REQUEST_REJECTED') ORDER BY timestamp DESC LIMIT 5`
    );
    assert(logs && logs.length >= 3, "Audit logs recorded for creation, approval, and rejection", `${logs.length} entries`);
    const actions = logs.map((l) => l.action);
    assert(actions.includes("LEAVE_REQUEST_CREATED"), "LEAVE_REQUEST_CREATED logged");
    assert(actions.includes("LEAVE_REQUEST_APPROVED"), "LEAVE_REQUEST_APPROVED logged");
    assert(actions.includes("LEAVE_REQUEST_REJECTED"), "LEAVE_REQUEST_REJECTED logged");
  }

  console.log("\n========================================================================");
  console.log(`  HR LEAVE AUDIT COMPLETE: ${passed + failed} Checks | ${passed} PASSED | ${failed} FAILED`);
  console.log("========================================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

testHrLeaveSystem().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
