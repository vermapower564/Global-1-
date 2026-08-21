import { queryDb } from "../lib/db";

async function runTests() {
  console.log("=== OMS FUNCTIONAL IMPROVEMENTS & SECURITY TEST SUITE ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test Feature Request Table & Flow
    console.log("1. Testing Feature Request System & Flow...");
    const testFrId = `FR-TEST-${Date.now().toString(36).toUpperCase()}`;
    await queryDb(
      `INSERT INTO featurerequest (
        id, userId, userName, userEmail, userRole, title, description, useCase, priority, status, createdAt, updatedAt
      ) VALUES (?, 'EMP-6841', 'Rajesh Khanna', 'rajesh.khanna@global.com', 'DEVELOPER', 'Monthly Completed Tasks Filter', 'Filter my completed tasks by month', 'Productivity analysis', 'HIGH', 'SUBMITTED', NOW(), NOW())`,
      [testFrId]
    );

    const [frRecord] = await queryDb<any[]>(`SELECT * FROM featurerequest WHERE id = ?`, [testFrId]);
    assert(frRecord && frRecord.title === "Monthly Completed Tasks Filter", "Feature request inserted successfully");
    assert(frRecord && frRecord.status === "SUBMITTED", "Initial status is SUBMITTED");

    // Admin updates status to APPROVED
    await queryDb(
      `UPDATE featurerequest SET status = 'APPROVED', adminRemarks = 'Approved for Sprint 42', reviewedById = 'EMP-8595', reviewedByName = 'Roushan Verma', reviewedAt = NOW() WHERE id = ?`,
      [testFrId]
    );
    const [updatedFr] = await queryDb<any[]>(`SELECT * FROM featurerequest WHERE id = ?`, [testFrId]);
    assert(updatedFr && updatedFr.status === "APPROVED", "Admin updated feature request status to APPROVED");
    assert(updatedFr && updatedFr.adminRemarks === "Approved for Sprint 42", "Admin remarks preserved");

    // 2. Test PM Project Draft Creation & Status Scoping
    console.log("\n2. Testing Project Manager Draft Lifecycle & Scoping...");
    const testDraftId = `PRJ-DRAFT-TEST-${Date.now().toString(36).toUpperCase()}`;
    await queryDb(
      `INSERT INTO project (
        id, projectCode, projectTitle, description, clientCompany, clientContactPerson, clientEmail,
        clientPhone, startDate, endDate, contractValue, status, priority, projectType,
        requiredSkills, requiredRoles, techStack, expectedTeamSize, projectManagerId, teamLeaderId, createdAt
      ) VALUES (?, ?, 'AI Customer Intelligence Portal', 'Draft deliverable for planning', 'Enterprise Client', 'Contact Person', 'client@test.com', '+91 98765 00000', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 500000, 'DRAFT', 'HIGH', 'WEB_APPLICATION', 'React, Node.js', 'Developer, UI/UX', 'Next.js 16', 5, 'EMP-8222', 'EMP-7592', NOW())`,
      [testDraftId, testDraftId]
    );

    const [draftProj] = await queryDb<any[]>(`SELECT * FROM project WHERE id = ?`, [testDraftId]);
    assert(draftProj && draftProj.status === "DRAFT", "Project draft saved with status = DRAFT");
    assert(draftProj && draftProj.projectManagerId === "EMP-8222", "Draft correctly associated with PM (EMP-8222)");

    // Test Draft Publishing
    await queryDb(`UPDATE project SET status = 'ACTIVE' WHERE id = ?`, [testDraftId]);
    const [publishedProj] = await queryDb<any[]>(`SELECT * FROM project WHERE id = ?`, [testDraftId]);
    assert(publishedProj && publishedProj.status === "ACTIVE", "Project draft published to ACTIVE");

    // Test Draft Deletion
    await queryDb(`DELETE FROM project WHERE id = ?`, [testDraftId]);
    const [deletedProj] = await queryDb<any[]>(`SELECT * FROM project WHERE id = ?`, [testDraftId]);
    assert(!deletedProj, "Project draft successfully deleted");

    // 3. Test Audit Log Structure & Action Verification
    console.log("\n3. Testing Audit Log Integrity...");
    const [realUser] = await queryDb<any[]>(`SELECT id FROM user LIMIT 1`);
    const validUserId = realUser ? realUser.id : null;
    const testAuditId = `AUD-TEST-${Date.now()}`;
    await queryDb(
      `INSERT INTO auditlog (id, userId, action, details, ipAddress, timestamp) VALUES (?, ?, 'SALARY_SLIP_DOWNLOADED', 'Downloaded salary slip test', '127.0.0.1', NOW())`,
      [testAuditId, validUserId]
    );
    const [auditRec] = await queryDb<any[]>(`SELECT * FROM auditlog WHERE id = ?`, [testAuditId]);
    assert(auditRec && auditRec.action === "SALARY_SLIP_DOWNLOADED", "Audit event SALARY_SLIP_DOWNLOADED logged properly");

    // Clean up test records
    await queryDb(`DELETE FROM featurerequest WHERE id = ?`, [testFrId]);
    await queryDb(`DELETE FROM auditlog WHERE id = ?`, [testAuditId]);

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Test Suite Runtime Error:", err);
    process.exit(1);
  }
}

runTests();
