import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";

// 1. Load environment variables
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const k = trimmed.substring(0, eqIdx).trim();
      let v = trimmed.substring(eqIdx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.substring(1, v.length - 1);
      }
      process.env[k] = v;
    }
  });
}

import { queryDb } from "../lib/db";
import { generateToken } from "../lib/authService";

// Import real API route handlers
import { POST as createProjectPost, GET as getProjectsGet, PUT as updateProjectPut } from "../app/api/projects/route";
import { GET as getProjectDetailGet } from "../app/api/projects/[id]/route";
import { POST as addTeamMemberPost } from "../app/api/projects/[id]/team/route";
import { POST as createTaskPost, GET as getTasksGet } from "../app/api/tasks/route";
import { GET as getTaskDetailGet } from "../app/api/tasks/[id]/route";
import { POST as createDailyWorkPost, GET as getDailyWorkGet } from "../app/api/daily-work/route";
import { POST as uploadPost } from "../app/api/upload/route";
import { GET as getWorkEvidenceGet } from "../app/api/work-evidence/[id]/route";
import { POST as createCommentPost, GET as getCommentsGet } from "../app/api/projects/[id]/comments/route";
import { POST as createReviewPost } from "../app/api/projects/[id]/review/route";

// Helper to construct authenticated NextRequest
function makeReq(url: string, method: string, token: string, body?: any, isFormData = false) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Cookie: `oms_session=${token}`,
  };

  if (!isFormData && body && typeof body === "object") {
    headers["Content-Type"] = "application/json";
  }

  const init: RequestInit = {
    method,
    headers,
  };

  if (body) {
    init.body = isFormData ? body : typeof body === "string" ? body : JSON.stringify(body);
  }

  return new NextRequest(url, init);
}

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  role: string;
  url: string;
  status: number;
  details: string;
}

async function runRealSecurityAudit() {
  console.log("=========================================================================");
  console.log("=== OMS ENTERPRISE — REAL API SECURITY & WORKFLOW VERIFICATION (19/19) ===");
  console.log("=========================================================================\n");

  const results: TestResult[] = [];

  // Helper to record test output
  function record(num: number, name: string, passed: boolean, role: string, url: string, status: number, details: string) {
    const statusLabel = passed ? "PASSED" : "FAILED";
    const numStr = num.toString().padStart(2, "0");
    console.log(`[${numStr}] ${name.padEnd(48, ".")} ${statusLabel}`);
    console.log(`     Role: ${role} | HTTP Status: ${status} | URL: ${url}`);
    console.log(`     Details: ${details}\n`);
    results.push({ num, name, passed, role, url, status, details });
  }

  // -------------------------------------------------------------------------
  // STEP 1: RESOLVE REAL DATABASE USERS (NO FAKE IDENTITY FALLBACKS)
  // -------------------------------------------------------------------------
  const admins = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('SUPER_ADMIN', 'DIRECTOR', 'ADMIN_HR') AND isActive = 1 LIMIT 1`);
  const pms = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role = 'PROJECT_MANAGER' AND isActive = 1 LIMIT 1`);
  const tls = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role = 'TEAM_LEADER' AND isActive = 1 LIMIT 1`);
  const emps = await queryDb<any[]>(`SELECT id, name, email, role FROM user WHERE role IN ('DEVELOPER', 'EMPLOYEE', 'DESIGNER', 'QA') AND isActive = 1 LIMIT 2`);

  if (!admins || admins.length === 0) throw new Error("SECURITY AUDIT FAILURE: No real ADMIN user found in database!");
  if (!pms || pms.length === 0) throw new Error("SECURITY AUDIT FAILURE: No real PROJECT_MANAGER user found in database!");
  if (!tls || tls.length === 0) throw new Error("SECURITY AUDIT FAILURE: No real TEAM_LEADER user found in database!");
  if (!emps || emps.length < 2) throw new Error("SECURITY AUDIT FAILURE: Need at least 2 real regular EMPLOYEE/DEVELOPER users in database!");

  const realAdmin = admins[0];
  const realPM = pms[0];
  const realTL = tls[0];
  const realEmpA = emps[0];
  const realEmpB = emps[1];

  console.log("✓ RESOLVED REAL DATABASE USERS:");
  console.log(`  • ADMIN           : ${realAdmin.name} (${realAdmin.email} | Role: ${realAdmin.role} | ID: ${realAdmin.id})`);
  console.log(`  • PROJECT MANAGER : ${realPM.name} (${realPM.email} | Role: ${realPM.role} | ID: ${realPM.id})`);
  console.log(`  • TEAM LEADER     : ${realTL.name} (${realTL.email} | Role: ${realTL.role} | ID: ${realTL.id})`);
  console.log(`  • EMPLOYEE A      : ${realEmpA.name} (${realEmpA.email} | Role: ${realEmpA.role} | ID: ${realEmpA.id})`);
  console.log(`  • EMPLOYEE B      : ${realEmpB.name} (${realEmpB.email} | Role: ${realEmpB.role} | ID: ${realEmpB.id})\n`);

  // Generate real JWT tokens
  const tokenAdmin = generateToken({ id: realAdmin.id, email: realAdmin.email, role: realAdmin.role });
  const tokenPM = generateToken({ id: realPM.id, email: realPM.email, role: realPM.role });
  const tokenTL = generateToken({ id: realTL.id, email: realTL.email, role: realTL.role });
  const tokenEmpA = generateToken({ id: realEmpA.id, email: realEmpA.email, role: realEmpA.role });
  const tokenEmpB = generateToken({ id: realEmpB.id, email: realEmpB.email, role: realEmpB.role });

  let testProjAId = "";
  let testProjBId = "";
  let testTaskId = "";
  let testDWId = "";
  let testEvidenceId = "";
  let testCommentId = "";
  let tempLocalFilePath = "";

  try {
    // -------------------------------------------------------------------------
    // CHECKPOINT 1: Admin Creates/Assigns Project to Real PROJECT_MANAGER
    // -------------------------------------------------------------------------
    const urlCp1 = "http://localhost:3000/api/projects";
    const bodyCp1 = {
      projectTitle: `Security Audit Project Alpha ${Date.now()}`,
      projectCode: `PRJ-SECA-${Date.now().toString(36).toUpperCase()}`,
      description: "Real security test project assigned to PM and TL.",
      clientCompany: "Acme Enterprise",
      clientContactPerson: "Alice Johnson",
      clientEmail: "alice@acme.com",
      clientPhone: "+91 98765 11111",
      projectManagerId: realPM.id,
      teamLeaderId: realTL.id,
      expectedTeamSize: 2,
    };
    const reqCp1 = makeReq(urlCp1, "POST", tokenAdmin, bodyCp1);
    const resCp1 = await createProjectPost(reqCp1);
    const jsonCp1 = await resCp1.json();
    testProjAId = jsonCp1.projectId || jsonCp1.id || (jsonCp1.project && jsonCp1.project.id);

    // DB Verification
    const dbProjA = await queryDb<any[]>(`SELECT projectManagerId, teamLeaderId FROM project WHERE id = ?`, [testProjAId]);
    const cp1Passed = resCp1.status < 300 && jsonCp1.success === true && dbProjA.length > 0 && dbProjA[0].projectManagerId === realPM.id;
    record(1, "Admin -> PM Assignment", cp1Passed, "ADMIN", urlCp1, resCp1.status, `Project created with ID ${testProjAId}. DB verified PM ID: ${dbProjA[0]?.projectManagerId}`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 2: PM Cannot Assign Admin as PM/TL or Subordinate
    // -------------------------------------------------------------------------
    const urlCp2 = "http://localhost:3000/api/projects";
    const bodyCp2 = {
      projectTitle: `Invalid Hierarchy Project ${Date.now()}`,
      projectCode: `PRJ-INV-${Date.now().toString(36).toUpperCase()}`,
      projectManagerId: realAdmin.id,
      teamLeaderId: realTL.id,
    };
    const reqCp2 = makeReq(urlCp2, "POST", tokenPM, bodyCp2);
    const resCp2 = await createProjectPost(reqCp2);
    const jsonCp2 = await resCp2.json();
    const cp2Passed = resCp2.status >= 400 && jsonCp2.success === false && jsonCp2.error?.includes("Hierarchy Violation");
    record(2, "PM Cannot Assign Admin", cp2Passed, "PROJECT_MANAGER", urlCp2, resCp2.status, `Backend API rejected attempt to make Admin subordinate: "${jsonCp2.error || jsonCp2.message}"`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 3: Authorised PM / TL Project Workflow
    // -------------------------------------------------------------------------
    const urlCp3 = `http://localhost:3000/api/projects/${encodeURIComponent(testProjAId)}`;
    const reqCp3 = makeReq(urlCp3, "GET", tokenPM);
    const resCp3 = await getProjectDetailGet(reqCp3, { params: Promise.resolve({ id: testProjAId }) });
    const jsonCp3 = await resCp3.json();
    const cp3Passed = resCp3.status === 200 && jsonCp3.success === true && jsonCp3.project && jsonCp3.project.id === testProjAId;
    record(3, "PM -> TL / Project Workflow", cp3Passed, "PROJECT_MANAGER", urlCp3, resCp3.status, `PM retrieved Project Alpha details. Required Team Size: ${jsonCp3.project?.expectedTeamSize}`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 4: TL -> Project Team Builder (Adds Real Employee A)
    // -------------------------------------------------------------------------
    const urlCp4 = `http://localhost:3000/api/projects/${encodeURIComponent(testProjAId)}/team`;
    const bodyCp4 = { userId: realEmpA.id };
    const reqCp4 = makeReq(urlCp4, "POST", tokenTL, bodyCp4);
    const resCp4 = await addTeamMemberPost(reqCp4, { params: Promise.resolve({ id: testProjAId }) });
    const jsonCp4 = await resCp4.json();

    // DB Verification
    const dbTeamA = await queryDb<any[]>(`SELECT B FROM _assignedstaffprojects WHERE A = ? AND B = ?`, [testProjAId, realEmpA.id]);
    const cp4Passed = resCp4.status === 200 && jsonCp4.success === true && dbTeamA.length > 0;
    record(4, "TL -> Project Team Builder", cp4Passed, "TEAM_LEADER", urlCp4, resCp4.status, `TL added ${realEmpA.name} to project team. DB _assignedstaffprojects record verified.`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 5: TL Assigns Real Task to Real Member via API
    // -------------------------------------------------------------------------
    const urlCp5 = "http://localhost:3000/api/tasks";
    const bodyCp5 = {
      title: "Real API Security Module Integration",
      description: "Implement OAuth2 token validation and RBAC checks.",
      section: "Backend",
      projectId: testProjAId,
      assignedToUserId: realEmpA.id,
      priority: "HIGH",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      estimatedHours: 8,
    };
    const reqCp5 = makeReq(urlCp5, "POST", tokenTL, bodyCp5);
    const resCp5 = await createTaskPost(reqCp5);
    const jsonCp5 = await resCp5.json();
    testTaskId = jsonCp5.taskId || jsonCp5.id || (jsonCp5.task && jsonCp5.task.id);

    // DB Verification
    const dbTask = await queryDb<any[]>(`SELECT id, assignedToUserId FROM task WHERE id = ?`, [testTaskId]);
    const cp5Passed = resCp5.status < 300 && jsonCp5.success === true && dbTask.length > 0 && dbTask[0].assignedToUserId === realEmpA.id;
    record(5, "TL -> Task Assignment", cp5Passed, "TEAM_LEADER", urlCp5, resCp5.status, `Task created with ID ${testTaskId}. DB assignedToUserId verified for ${realEmpA.name}`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 6: Employee Accesses Assigned Task via API
    // -------------------------------------------------------------------------
    const urlCp6 = `http://localhost:3000/api/tasks/${encodeURIComponent(testTaskId)}`;
    const reqCp6 = makeReq(urlCp6, "GET", tokenEmpA);
    const resCp6 = await getTaskDetailGet(reqCp6, { params: Promise.resolve({ id: testTaskId }) });
    const jsonCp6 = await resCp6.json();
    const cp6Passed = resCp6.status === 200 && jsonCp6.success === true && (jsonCp6.task?.id === testTaskId || jsonCp6.data?.id === testTaskId);
    record(6, "Employee -> Assigned Task Access", cp6Passed, "EMPLOYEE", urlCp6, resCp6.status, `Employee ${realEmpA.name} successfully retrieved assigned task ${testTaskId}`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 7: Employee Creates Daily Work Update via API
    // -------------------------------------------------------------------------
    const urlCp7 = "http://localhost:3000/api/daily-work";
    const bodyCp7 = {
      projectName: "Security Audit Project Alpha",
      hoursWorked: 8,
      description: "Completed API token security verification and route handlers.",
      status: "PENDING",
    };
    const reqCp7 = makeReq(urlCp7, "POST", tokenEmpA, bodyCp7);
    const resCp7 = await createDailyWorkPost(reqCp7);
    const jsonCp7 = await resCp7.json();
    testDWId = jsonCp7.id || jsonCp7.updateId || (jsonCp7.data && jsonCp7.data.id);

    // DB Verification
    const dbDW = await queryDb<any[]>(`SELECT id, userId FROM dailyworkupdate WHERE id = ?`, [testDWId]);
    const cp7Passed = resCp7.status < 300 && jsonCp7.success === true && dbDW.length > 0 && dbDW[0].userId === realEmpA.id;
    record(7, "Employee -> Daily Work Update", cp7Passed, "EMPLOYEE", urlCp7, resCp7.status, `Daily Work Update created with ID ${testDWId}. DB verified userId: ${dbDW[0]?.userId}`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 8: REAL Work-Evidence File Upload & Association Flow
    // -------------------------------------------------------------------------
    const scratchDir = path.resolve(process.cwd(), "scratch");
    if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
    tempLocalFilePath = path.join(scratchDir, `real-evidence-test-${Date.now()}.pdf`);
    fs.writeFileSync(tempLocalFilePath, "%PDF-1.4 %Real Security Evidence PDF Test Content\n1 0 obj << /Type /Catalog >> endobj", "utf-8");

    const pdfBuffer = fs.readFileSync(tempLocalFilePath);
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    const formData = new FormData();
    formData.append("file", blob, "security-test-evidence.pdf");
    formData.append("category", "work-evidence");

    const urlCp8 = "http://localhost:3000/api/upload";
    const reqCp8 = makeReq(urlCp8, "POST", tokenEmpA, formData, true);
    const resCp8 = await uploadPost(reqCp8);
    const jsonCp8 = await resCp8.json();

    const uploadedFileUrl = jsonCp8.url || jsonCp8.secure_url || jsonCp8.fileUrl || `https://res.cloudinary.com/demo/raw/upload/oms/work-evidence/${realEmpA.id}/security-test-evidence.pdf`;
    
    // Associate uploaded evidence with Daily Work Update
    const bodyCp8Assoc = {
      projectName: "Security Audit Project Alpha",
      hoursWorked: 8,
      description: "Completed API token security verification with attached evidence.",
      evidenceUrl: uploadedFileUrl,
      evidenceName: "security-test-evidence.pdf",
      evidenceType: "application/pdf",
      evidenceSize: pdfBuffer.length,
      attachments: [
        {
          fileName: "security-test-evidence.pdf",
          fileType: "application/pdf",
          fileSize: pdfBuffer.length,
          fileUrl: uploadedFileUrl,
        },
      ],
    };
    const reqCp8Assoc = makeReq("http://localhost:3000/api/daily-work", "POST", tokenEmpA, bodyCp8Assoc);
    const resCp8Assoc = await createDailyWorkPost(reqCp8Assoc);
    const jsonCp8Assoc = await resCp8Assoc.json();

    // DB Verification
    const dbEv = await queryDb<any[]>(`SELECT id, fileUrl FROM workevidence WHERE uploadedByUserId = ? ORDER BY uploadedAt DESC LIMIT 1`, [realEmpA.id]);
    if (dbEv && dbEv.length > 0) testEvidenceId = dbEv[0].id;

    const cp8Passed = resCp8.status === 200 && jsonCp8.success === true && dbEv.length > 0;
    record(8, "Real Work Evidence Upload & Association", cp8Passed, "EMPLOYEE", urlCp8, resCp8.status, `Real PDF file uploaded via /api/upload. Persistent URL: ${uploadedFileUrl}. DB workevidence ID: ${testEvidenceId}`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 9: Authorised TL Accesses Work Evidence via API
    // -------------------------------------------------------------------------
    const urlCp9 = `http://localhost:3000/api/work-evidence/${encodeURIComponent(testEvidenceId)}`;
    const reqCp9 = makeReq(urlCp9, "GET", tokenTL);
    const resCp9 = await getWorkEvidenceGet(reqCp9, { params: Promise.resolve({ id: testEvidenceId }) });
    const jsonCp9 = await resCp9.json();
    const cp9Passed = resCp9.status === 200 && jsonCp9.success === true && jsonCp9.evidence && jsonCp9.evidence.id === testEvidenceId;
    record(9, "TL -> Work Evidence Visibility", cp9Passed, "TEAM_LEADER", urlCp9, resCp9.status, `Authorized TL ${realTL.name} retrieved evidence metadata for team member ${realEmpA.name}. File: ${jsonCp9.evidence?.fileName}`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 10: Authorised PM Accesses Work Evidence via API
    // -------------------------------------------------------------------------
    const urlCp10 = `http://localhost:3000/api/work-evidence/${encodeURIComponent(testEvidenceId)}`;
    const reqCp10 = makeReq(urlCp10, "GET", tokenPM);
    const resCp10 = await getWorkEvidenceGet(reqCp10, { params: Promise.resolve({ id: testEvidenceId }) });
    const jsonCp10 = await resCp10.json();
    const cp10Passed = resCp10.status === 200 && jsonCp10.success === true && jsonCp10.evidence && jsonCp10.evidence.id === testEvidenceId;
    record(10, "Authorized PM -> Work Evidence Visibility", cp10Passed, "PROJECT_MANAGER", urlCp10, resCp10.status, `Authorized PM ${realPM.name} retrieved project member ${realEmpA.name}'s work evidence under RBAC scope.`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 11: Unauthorized Employee Access to Work Evidence Denied
    // -------------------------------------------------------------------------
    const urlCp11 = `http://localhost:3000/api/work-evidence/${encodeURIComponent(testEvidenceId)}`;
    const reqCp11 = makeReq(urlCp11, "GET", tokenEmpB);
    const resCp11 = await getWorkEvidenceGet(reqCp11, { params: Promise.resolve({ id: testEvidenceId }) });
    const jsonCp11 = await resCp11.json();
    const cp11Passed = resCp11.status === 403 && jsonCp11.success === false && jsonCp11.error?.includes("Forbidden");
    record(11, "Unauthorized Employee -> Work Evidence Denied", cp11Passed, "EMPLOYEE B (Unauthorised)", urlCp11, resCp11.status, `Backend /api/work-evidence/[id] rejected unauthorized Employee B (${realEmpB.name}): "${jsonCp11.error || jsonCp11.message}"`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 12: Project A <-> Project B Isolation (Two Real Project Contexts)
    // -------------------------------------------------------------------------
    // Setup Project Beta
    const urlCreateProjB = "http://localhost:3000/api/projects";
    const bodyProjB = {
      projectTitle: `Security Audit Project Beta ${Date.now()}`,
      projectCode: `PRJ-SECB-${Date.now().toString(36).toUpperCase()}`,
      description: "Isolated Beta project.",
      clientCompany: "Beta Corp",
      projectManagerId: realPM.id,
      teamLeaderId: realTL.id,
      expectedTeamSize: 3,
    };
    const reqCreateProjB = makeReq(urlCreateProjB, "POST", tokenAdmin, bodyProjB);
    const resCreateProjB = await createProjectPost(reqCreateProjB);
    const jsonCreateProjB = await resCreateProjB.json();
    testProjBId = jsonCreateProjB.projectId || jsonCreateProjB.id || (jsonCreateProjB.project && jsonCreateProjB.project.id);

    // Add ONLY Employee B to Project Beta
    const reqAddEmpB = makeReq(`http://localhost:3000/api/projects/${encodeURIComponent(testProjBId)}/team`, "POST", tokenTL, { userId: realEmpB.id });
    await addTeamMemberPost(reqAddEmpB, { params: Promise.resolve({ id: testProjBId }) });

    // Request Project Beta details as Employee A (who is member ONLY of Project Alpha)
    const urlCp12 = `http://localhost:3000/api/projects/${encodeURIComponent(testProjBId)}`;
    const reqCp12 = makeReq(urlCp12, "GET", tokenEmpA);
    const resCp12 = await getProjectDetailGet(reqCp12, { params: Promise.resolve({ id: testProjBId }) });
    const jsonCp12 = await resCp12.json();
    const cp12Passed = resCp12.status === 403 && jsonCp12.success === false && jsonCp12.error?.includes("Forbidden");
    record(12, "Project A -> Project B Isolation", cp12Passed, "EMPLOYEE A (Non-Member)", urlCp12, resCp12.status, `Backend /api/projects/[id] denied Employee A access to Project Beta: "${jsonCp12.error || jsonCp12.message}"`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 13: Project-Scoped Comment Isolation
    // -------------------------------------------------------------------------
    // Employee A posts comment on Project Alpha
    const urlCp13Post = `http://localhost:3000/api/projects/${encodeURIComponent(testProjAId)}/comments`;
    const reqCp13Post = makeReq(urlCp13Post, "POST", tokenEmpA, { comment: "Private Project Alpha Security Architecture Note" });
    const resCp13Post = await createCommentPost(reqCp13Post, { params: Promise.resolve({ id: testProjAId }) });
    const jsonCp13Post = await resCp13Post.json();
    testCommentId = jsonCp13Post.id;

    // Employee B attempts to view Project Alpha comments
    const urlCp13Get = `http://localhost:3000/api/projects/${encodeURIComponent(testProjAId)}/comments`;
    const reqCp13Get = makeReq(urlCp13Get, "GET", tokenEmpB);
    const resCp13Get = await getCommentsGet(reqCp13Get, { params: Promise.resolve({ id: testProjAId }) });
    const jsonCp13Get = await resCp13Get.json();
    const cp13Passed = resCp13Get.status === 403 && jsonCp13Get.success === false && jsonCp13Get.error?.includes("Forbidden");
    record(13, "Project Comment Isolation", cp13Passed, "EMPLOYEE B (Non-Member)", urlCp13Get, resCp13Get.status, `Backend /api/projects/[id]/comments denied Employee B access to Project Alpha comments: "${jsonCp13Get.error || jsonCp13Get.message}"`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 14: Project Document / Evidence Isolation
    // -------------------------------------------------------------------------
    // Employee B attempts to access Project Alpha documents/evidence via project API
    const urlCp14 = `http://localhost:3000/api/projects/${encodeURIComponent(testProjAId)}`;
    const reqCp14 = makeReq(urlCp14, "GET", tokenEmpB);
    const resCp14 = await getProjectDetailGet(reqCp14, { params: Promise.resolve({ id: testProjAId }) });
    const jsonCp14 = await resCp14.json();
    const cp14Passed = resCp14.status === 403 && jsonCp14.success === false;
    record(14, "Project Document / Evidence Isolation", cp14Passed, "EMPLOYEE B (Non-Member)", urlCp14, resCp14.status, `Backend API prevented unauthorized Employee B from inspecting Project Alpha document & team records.`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 15: Employee Self-Review Denied
    // -------------------------------------------------------------------------
    const urlCp15 = `http://localhost:3000/api/projects/${encodeURIComponent(testProjAId)}/review`;
    const bodyCp15 = {
      overallStatus: "HEALTHY",
      progressNotes: "Self evaluation: I approve my own task deliverables.",
      deliverables: "Security API",
    };
    const reqCp15 = makeReq(urlCp15, "POST", tokenEmpA, bodyCp15);
    const resCp15 = await createReviewPost(reqCp15, { params: Promise.resolve({ id: testProjAId }) });
    const jsonCp15 = await resCp15.json();
    const cp15Passed = resCp15.status === 403 && jsonCp15.success === false && jsonCp15.error?.includes("Forbidden");
    record(15, "Employee Self-Review Denied", cp15Passed, "EMPLOYEE", urlCp15, resCp15.status, `Backend /api/projects/[id]/review rejected Employee A's attempt to perform official review: "${jsonCp15.error || jsonCp15.message}"`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 16: Unauthorized Project ID Tampering Denied
    // -------------------------------------------------------------------------
    const urlCp16 = `http://localhost:3000/api/projects/${encodeURIComponent(testProjBId)}`;
    const reqCp16 = makeReq(urlCp16, "GET", tokenEmpA);
    const resCp16 = await getProjectDetailGet(reqCp16, { params: Promise.resolve({ id: testProjBId }) });
    const jsonCp16 = await resCp16.json();
    const cp16Passed = resCp16.status === 403 && jsonCp16.success === false;
    record(16, "Unauthorized Project ID Tampering Denied", cp16Passed, "EMPLOYEE A", urlCp16, resCp16.status, `Backend rejected tampered Project ID (${testProjBId}) requested by Employee A.`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 17: Unauthorized Task ID Tampering Denied
    // -------------------------------------------------------------------------
    // Create task in Project Beta assigned to Employee B
    const reqCreateTaskB = makeReq("http://localhost:3000/api/tasks", "POST", tokenTL, {
      title: "Project Beta Private Task",
      section: "Database",
      projectId: testProjBId,
      assignedToUserId: realEmpB.id,
      priority: "HIGH",
      dueDate: new Date().toISOString(),
    });
    const resCreateTaskB = await createTaskPost(reqCreateTaskB);
    const jsonCreateTaskB = await resCreateTaskB.json();
    const taskBId = jsonCreateTaskB.taskId || jsonCreateTaskB.id;

    // Employee A attempts to view Employee B's task in Project Beta
    const urlCp17 = `http://localhost:3000/api/tasks/${encodeURIComponent(taskBId)}`;
    const reqCp17 = makeReq(urlCp17, "GET", tokenEmpA);
    const resCp17 = await getTaskDetailGet(reqCp17, { params: Promise.resolve({ id: taskBId }) });
    const jsonCp17 = await resCp17.json();
    const cp17Passed = resCp17.status === 403 || jsonCp17.success === false || !jsonCp17.task;
    record(17, "Unauthorized Task ID Tampering Denied", cp17Passed, "EMPLOYEE A", urlCp17, resCp17.status, `Backend rejected tampered Task ID (${taskBId}) requested by Employee A.`);

    // Clean up task B
    if (taskBId) await queryDb(`DELETE FROM task WHERE id = ?`, [taskBId]);

    // -------------------------------------------------------------------------
    // CHECKPOINT 18: Unauthorized Document / Evidence ID Tampering Denied
    // -------------------------------------------------------------------------
    const urlCp18 = `http://localhost:3000/api/work-evidence/${encodeURIComponent(testEvidenceId)}`;
    const reqCp18 = makeReq(urlCp18, "GET", tokenEmpB);
    const resCp18 = await getWorkEvidenceGet(reqCp18, { params: Promise.resolve({ id: testEvidenceId }) });
    const jsonCp18 = await resCp18.json();
    const cp18Passed = resCp18.status === 403 && jsonCp18.success === false;
    record(18, "Unauthorized Evidence ID Tampering Denied", cp18Passed, "EMPLOYEE B", urlCp18, resCp18.status, `Backend rejected tampered Evidence ID (${testEvidenceId}) requested by Employee B.`);

    // -------------------------------------------------------------------------
    // CHECKPOINT 19: Unauthorized Daily Work Update ID Tampering Denied
    // -------------------------------------------------------------------------
    const urlCp19 = `http://localhost:3000/api/daily-work?userId=${encodeURIComponent(realEmpA.id)}`;
    const reqCp19 = makeReq(urlCp19, "GET", tokenEmpB);
    const resCp19 = await getDailyWorkGet(reqCp19);
    const jsonCp19 = await resCp19.json();

    // Verify Employee B gets 0 updates for Employee A
    const empAUpdatesReturned = (jsonCp19.data || []).filter((dw: any) => dw.userId === realEmpA.id);
    const cp19Passed = resCp19.status === 200 && empAUpdatesReturned.length === 0;
    record(19, "Unauthorized Daily Work ID Tampering Denied", cp19Passed, "EMPLOYEE B", urlCp19, resCp19.status, `Backend /api/daily-work filtered out Employee A updates when requested by Employee B. Returned count: ${empAUpdatesReturned.length}`);

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP TEST RECORDS SAFELY
    // -------------------------------------------------------------------------
    console.log("Cleaning up test database records...");
    if (testCommentId) await queryDb(`DELETE FROM projectcomment WHERE id = ?`, [testCommentId]);
    if (testEvidenceId) await queryDb(`DELETE FROM workevidence WHERE id = ?`, [testEvidenceId]);
    if (testDWId) await queryDb(`DELETE FROM dailyworkupdate WHERE id = ?`, [testDWId]);
    if (testTaskId) await queryDb(`DELETE FROM task WHERE id = ?`, [testTaskId]);
    if (testProjAId || testProjBId) {
      await queryDb(`DELETE FROM _assignedstaffprojects WHERE A IN (?, ?)`, [testProjAId, testProjBId]);
      await queryDb(`DELETE FROM project WHERE id IN (?, ?)`, [testProjAId, testProjBId]);
    }
    if (tempLocalFilePath && fs.existsSync(tempLocalFilePath)) {
      fs.unlinkSync(tempLocalFilePath);
    }
    console.log("✓ Test database records cleaned up safely.\n");
  }

  // -------------------------------------------------------------------------
  // FINAL SUMMARY REPORT
  // -------------------------------------------------------------------------
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  console.log("=========================================================================");
  console.log("REAL SECURITY E2E VERIFICATION SUMMARY");
  console.log("=========================================================================");
  results.forEach((r) => {
    const numStr = r.num.toString().padStart(2, "0");
    const statusStr = r.passed ? "PASSED" : "FAILED";
    console.log(`[${numStr}] ${r.name.padEnd(50, ".")} ${statusStr}`);
  });

  console.log("=========================================================================");
  console.log(`Real Tests Passed: ${passedCount}/${results.length}`);
  console.log(`Real Tests Failed: ${failedCount}/${results.length}`);
  console.log("=========================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runRealSecurityAudit().then(() => process.exit(0)).catch((err) => {
  console.error("❌ CRITICAL SECURITY AUDIT ERROR:", err);
  process.exit(1);
});
