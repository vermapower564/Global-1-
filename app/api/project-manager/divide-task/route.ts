import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"];

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in." },
        { status: 401 }
      );
    }

    const authUser = authResult.user;
    const isAdmin = ADMIN_ROLES.includes(authUser.role);

    const body = await request.json();
    const { mainTaskId, sections } = body;

    if (!mainTaskId || !sections || !Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json(
        { success: false, error: "Main task ID and at least one work section are required." },
        { status: 400 }
      );
    }

    // 1. Fetch Main Task
    const mainTaskRows = await queryDb<any[]>(
      `SELECT t.*, p.teamLeaderId, p.projectTitle
       FROM task t
       LEFT JOIN project p ON t.projectId = p.id
       WHERE t.id = ? LIMIT 1`,
      [mainTaskId]
    );

    if (!mainTaskRows || mainTaskRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Main task not found." },
        { status: 404 }
      );
    }

    const mainTask = mainTaskRows[0];

    // Authorization: User must be Admin OR the Project Manager assigned to this task
    if (!isAdmin && mainTask.assignedToUserId !== authUser.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to divide this main task." },
        { status: 403 }
      );
    }

    const projectId = mainTask.projectId;
    const defaultTeamLeaderId = mainTask.teamLeaderId;

    const createdSubtasks: any[] = [];

    // 2. Create Work Sections assigned to Team Leaders
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const sectionTitle = sec.title?.trim();
      const sectionName = sec.sectionName?.trim() || sec.section?.trim() || `Section ${i + 1}`;
      const targetTeamLeaderId = sec.teamLeaderId || defaultTeamLeaderId;

      if (!sectionTitle) continue;

      // Resolve teamLeaderId to user.id cuid if employeeId passed
      const userRows = await queryDb<any[]>(
        `SELECT id FROM user WHERE id = ? OR employeeId = ? LIMIT 1`,
        [targetTeamLeaderId, targetTeamLeaderId]
      );
      const resolvedTlId = userRows && userRows.length > 0 ? userRows[0].id : targetTeamLeaderId;

      if (!resolvedTlId) {
        return NextResponse.json(
          {
            success: false,
            error: `No Team Leader assigned for section "${sectionTitle}". Please assign a Team Leader to the project first.`,
          },
          { status: 400 }
        );
      }

      const subtaskId = `SEC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const dueDate = sec.dueDate ? new Date(sec.dueDate) : mainTask.dueDate;
      const priority = sec.priority || mainTask.priority || "MEDIUM";
      const estimatedHours = sec.estimatedHours ? parseFloat(sec.estimatedHours) : 16;

      await queryDb(
        `INSERT INTO task (
          id, title, description, section, projectId, parentTaskId, isMainTask,
          assignedToUserId, createdById, status, priority, progress,
          startDate, dueDate, estimatedHours, actualHours, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?, 0,
          ?, ?, 'ASSIGNED', ?, 0,
          NOW(), ?, ?, 0, NOW(), NOW()
        )`,
        [
          subtaskId,
          sectionTitle,
          sec.description?.trim() || null,
          sectionName,
          projectId,
          mainTaskId,
          resolvedTlId,
          authUser.id,
          priority,
          dueDate,
          estimatedHours,
        ]
      );

      createdSubtasks.push({
        id: subtaskId,
        title: sectionTitle,
        section: sectionName,
        teamLeaderId: resolvedTlId,
      });
    }

    // 3. Update Main Task status to IN_PROGRESS
    await queryDb(
      `UPDATE task SET status = 'IN_PROGRESS', isMainTask = 1, updatedAt = NOW() WHERE id = ?`,
      [mainTaskId]
    );

    // 4. Record Audit Log
    try {
      await prisma.auditlog.create({
        data: {
          userId: authUser.id,
          action: "PM_DIVIDED_MAIN_TASK",
          details: `Project Manager divided Main Task "${mainTask.title}" (${mainTaskId}) into ${createdSubtasks.length} work sections for Team Leader(s).`,
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation warning:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Main task divided into ${createdSubtasks.length} work sections successfully and assigned to Team Leader.`,
      mainTaskId,
      createdSubtasks,
    });
  } catch (error: any) {
    console.error("POST /api/project-manager/divide-task error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to divide main task." },
      { status: 500 }
    );
  }
}
