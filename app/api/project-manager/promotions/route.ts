import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    const canManagePromotions = ["SUPER_ADMIN", "DIRECTOR", "PROJECT_MANAGER"].includes(roleUpper);

    if (!canManagePromotions) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Project Managers and Super Admins can access promotion evaluations." },
        { status: 403 }
      );
    }

    // 1. Fetch all active employees (non-admin)
    const employees: any[] = await queryDb(
      `SELECT u.id, u.employeeId, u.name, u.email, u.phone, u.role, u.departmentId,
              u.joiningDate, u.avatarUrl, u.skills, u.experienceYears,
              d.name as departmentName
       FROM user u
       LEFT JOIN department d ON u.departmentId = d.id
       WHERE u.isActive = 1 AND u.role NOT IN ('SUPER_ADMIN', 'DIRECTOR')
       ORDER BY u.name ASC`
    );

    // 2. Fetch Tasks, Daily Updates, Reviews for performance evaluation
    const [allTasks, allUpdates, allReviews, promotionHistory]: any[] = await Promise.all([
      queryDb<any[]>(`SELECT id, assignedToUserId, status, dueDate, completedAt, blockerReason FROM task`),
      queryDb<any[]>(`SELECT id, userId, rating, status, hoursWorked, blockers FROM dailyworkupdate`),
      queryDb<any[]>(`SELECT id, userId, employeeId, rating FROM customerreview`),
      queryDb<any[]>(`SELECT * FROM promotionrecord ORDER BY createdAt DESC`),
    ]);

    const now = new Date();

    // 3. Compute multi-factor evaluation scores for each employee
    const evaluatedEmployees = employees.map((emp: any) => {
      const empTasks = (allTasks || []).filter((t: any) => t.assignedToUserId === emp.id);
      const empUpdates = (allUpdates || []).filter((u: any) => u.userId === emp.id);
      const empReviews = (allReviews || []).filter((r: any) => r.userId === emp.id || r.employeeId === emp.employeeId);

      const totalTasks = empTasks.length;
      const completedTasks = empTasks.filter((t: any) => t.status === "COMPLETED").length;
      const onTimeTasks = empTasks.filter((t: any) => {
        if (t.status !== "COMPLETED" || !t.dueDate) return false;
        const due = new Date(t.dueDate);
        const comp = t.completedAt ? new Date(t.completedAt) : now;
        return comp <= due;
      }).length;
      const activeTasks = empTasks.filter((t: any) => ["IN_PROGRESS", "ASSIGNED", "IN_REVIEW"].includes(t.status)).length;
      const blockedTasks = empTasks.filter((t: any) => t.status === "BLOCKED").length;

      // Factors:
      // 1. Task Completion (25%)
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 85;
      // 2. Work Quality (20%) - derived from ratings and approved updates
      const avgReviewRating = empReviews.length > 0 ? (empReviews.reduce((a: number, r: any) => a + (Number(r.rating) || 5), 0) / empReviews.length) : 4.8;
      const qualityRate = Math.min(100, Math.round((avgReviewRating / 5) * 100));
      // 3. On-Time Delivery (20%)
      const onTimeRate = completedTasks > 0 ? Math.round((onTimeTasks / completedTasks) * 100) : 90;
      // 4. Project Contribution (15%) - based on active participation & hours
      const approvedUpdates = empUpdates.filter((u: any) => u.status === "APPROVED").length;
      const contributionRate = Math.min(100, Math.max(60, Math.round((approvedUpdates > 0 ? approvedUpdates * 15 : totalTasks * 20))));
      // 5. Task Consistency (10%) - penalty for blocked tasks / inconsistency
      const blockedRatio = totalTasks > 0 ? blockedTasks / totalTasks : 0;
      const consistencyRate = Math.max(50, Math.round(100 - blockedRatio * 100));
      // 6. Leadership Performance (10%) - based on experience & seniority
      const leadershipRate = Math.min(100, Math.round(75 + (Number(emp.experienceYears) || 2) * 5));

      // Weighted Multi-Factor Score:
      const overallScore = Math.round(
        taskCompletionRate * 0.25 +
        qualityRate * 0.20 +
        onTimeRate * 0.20 +
        contributionRate * 0.15 +
        consistencyRate * 0.10 +
        leadershipRate * 0.10
      );

      // Workload %
      const workloadPct = Math.min(100, activeTasks * 20);

      // Eligibility: Score >= 85% and role is not already TEAM_LEADER or PM
      const isEligibleForPromotion = overallScore >= 80 && emp.role !== "TEAM_LEADER" && emp.role !== "PROJECT_MANAGER";

      return {
        ...emp,
        currentWorkload: workloadPct,
        availableCapacity: 100 - workloadPct,
        metrics: {
          totalTasks,
          completedTasks,
          activeTasks,
          blockedTasks,
          taskCompletionRate: Math.round(taskCompletionRate),
          qualityRate,
          onTimeRate,
          contributionRate,
          consistencyRate,
          leadershipRate,
          overallScore,
        },
        isEligibleForPromotion,
      };
    });

    return NextResponse.json({
      success: true,
      employees: evaluatedEmployees,
      promotionHistory: promotionHistory || [],
    });
  } catch (err: any) {
    console.error("Promotions GET Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to load promotions." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const authUser = authResult.user;
    const roleUpper = (authUser.role || "").toUpperCase();
    const canPromote = ["SUPER_ADMIN", "DIRECTOR", "PROJECT_MANAGER"].includes(roleUpper);

    if (!canPromote) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Project Managers and Super Admins can promote employees." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { employeeId, newRole, performanceScore, reason, comments } = body;

    if (!employeeId || !newRole || !reason) {
      return NextResponse.json(
        { success: false, error: "Employee ID, New Role, and Justification Reason are required." },
        { status: 400 }
      );
    }

    // 🔒 Single Super Admin rule: Never allow promotion to SUPER_ADMIN
    if (newRole.toUpperCase() === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Validation Error: Super Admin promotion is restricted to the single root organization account." },
        { status: 400 }
      );
    }

    // Find Target User
    const userRows = await queryDb<any[]>(
      `SELECT id, employeeId, name, role FROM user WHERE id = ? OR employeeId = ? LIMIT 1`,
      [employeeId, employeeId]
    );

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ success: false, error: "Target employee not found." }, { status: 404 });
    }

    const targetUser = userRows[0];
    const previousRole = targetUser.role;
    const targetRole = newRole.toUpperCase();

    // 1. Update user role in TiDB Cloud
    await queryDb(`UPDATE user SET role = ?, updatedAt = NOW() WHERE id = ?`, [targetRole, targetUser.id]);

    // 2. Insert immutable Promotion Record
    const recordId = `prom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await queryDb(
      `INSERT INTO promotionrecord (
        id, employeeId, userId, employeeName, previousRole, newRole, performanceScore, reason, promotedById, promotedByName, comments, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        recordId,
        targetUser.employeeId,
        targetUser.id,
        targetUser.name,
        previousRole,
        targetRole,
        Number(performanceScore) || 85.0,
        reason.trim(),
        authUser.id,
        (authUser as any).name || authUser.email,
        comments ? comments.trim() : null,
      ]
    );

    // 3. Log Audit Event
    await logAuditEvent(
      authUser.id,
      "EMPLOYEE_PROMOTION",
      `Promoted ${targetUser.name} (${targetUser.employeeId}) from ${previousRole} to ${targetRole}. Performance Score: ${performanceScore}%. Reason: ${reason}`
    );

    return NextResponse.json({
      success: true,
      message: `✓ Successfully promoted ${targetUser.name} to ${targetRole.replace(/_/g, " ")}!`,
      promotionRecord: {
        id: recordId,
        employeeName: targetUser.name,
        previousRole,
        newRole: targetRole,
        promotedByName: (authUser as any).name || authUser.email,
      },
    });
  } catch (err: any) {
    console.error("Promotions POST Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to execute promotion." }, { status: 500 });
  }
}
