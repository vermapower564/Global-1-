import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    const isTeamLeaderOrAdmin =
      ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER", "TEAM_LEADER"].includes(authUser.role);

    if (!isTeamLeaderOrAdmin) {
      // Check if user is a designated team leader for any project
      const ledProjects = await queryDb<any[]>(
        `SELECT id FROM project WHERE teamLeaderId = ? LIMIT 1`,
        [authUser.id]
      );
      if (!ledProjects || ledProjects.length === 0) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Team Leader permissions required to manage employee status." },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { employeeId, isActive } = body;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Employee ID is required." },
        { status: 400 }
      );
    }

    // Find the target user
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: employeeId }, { employeeId: employeeId }],
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Target employee not found." },
        { status: 404 }
      );
    }

    // Prevent deactivating Super Admins
    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Super Admin accounts cannot be deactivated." },
        { status: 403 }
      );
    }

    const newActiveState = typeof isActive === "boolean" ? isActive : !targetUser.isActive;

    // Update in MySQL
    await queryDb(`UPDATE user SET isActive = ?, updatedAt = NOW() WHERE id = ?`, [
      newActiveState ? 1 : 0,
      targetUser.id,
    ]);

    // Record Security Audit Log
    try {
      await prisma.auditlog.create({
        data: {
          userId: targetUser.id,
          action: newActiveState ? "EMPLOYEE_REACTIVATED_BY_TL" : "EMPLOYEE_DEACTIVATED_BY_TL",
          details: `Account ${newActiveState ? "reactivated" : "deactivated"} by Team Leader / Manager ID: ${authUser.id}`,
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation warning:", auditErr);
    }

    return NextResponse.json({
      success: true,
      isActive: newActiveState,
      message: `Employee ${targetUser.name} (${targetUser.employeeId}) account has been successfully ${
        newActiveState ? "activated" : "deactivated"
      }.`,
    });
  } catch (error: any) {
    console.error("Error toggling employee status by TL:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update employee account status." },
      { status: 500 }
    );
  }
}
