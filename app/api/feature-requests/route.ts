import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, logAuditEvent } from "@/lib/authMiddleware";
import { queryDb, clearQueryCache } from "@/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "ADMIN_HR", "ADMIN"];

// GET: Fetch feature requests
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return (
        authResult.response ||
        NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 })
      );
    }

    const authUser = authResult.user;
    const isAdmin = ADMIN_ROLES.includes((authUser.role || "").toUpperCase());

    // Admin sees all feature requests; regular users see only their own
    const rows = isAdmin
      ? await queryDb<any[]>(`SELECT * FROM featurerequest ORDER BY createdAt DESC`)
      : await queryDb<any[]>(
          `SELECT * FROM featurerequest WHERE userId = ? ORDER BY createdAt DESC`,
          [authUser.id]
        );

    return NextResponse.json({
      success: true,
      data: rows || [],
      total: (rows || []).length,
      isAdmin,
    });
  } catch (err: any) {
    console.error("Feature Requests GET Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to fetch feature requests." }, { status: 500 });
  }
}

// POST: Submit a new feature request
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return (
        authResult.response ||
        NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 })
      );
    }

    const authUser = authResult.user;
    const body = await request.json();
    const { title, description, useCase, priority = "MEDIUM" } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Feature title is required." }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ success: false, error: "Description of what you need is required." }, { status: 400 });
    }

    const id = `FR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const cleanPriority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(priority.toUpperCase())
      ? priority.toUpperCase()
      : "MEDIUM";

    await queryDb(
      `INSERT INTO featurerequest (
        id, userId, userName, userEmail, userRole, title, description, useCase, priority, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', NOW(), NOW())`,
      [
        id,
        authUser.id,
        (authUser as any).name || authUser.email.split("@")[0],
        authUser.email,
        authUser.role || "EMPLOYEE",
        title.trim(),
        description.trim(),
        useCase ? useCase.trim() : "Operational productivity improvement",
        cleanPriority,
      ]
    );

    await logAuditEvent(
      authUser.id,
      "FEATURE_REQUEST_CREATED",
      `User ${authUser.email} (${authUser.role}) submitted feature request: '${title.trim()}' (Priority: ${cleanPriority})`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json({
      success: true,
      message: "✓ Feature request submitted successfully for engineering review!",
      id,
    });
  } catch (err: any) {
    console.error("Feature Request POST Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to submit feature request." }, { status: 500 });
  }
}

// PUT: Admin updates feature request status & remarks
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return (
        authResult.response ||
        NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 })
      );
    }

    const authUser = authResult.user;
    const isAdmin = ADMIN_ROLES.includes((authUser.role || "").toUpperCase());

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Administrators can review and update feature request status." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status, adminRemarks } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Feature Request ID is required." }, { status: 400 });
    }

    const validStatuses = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "IN_PROGRESS", "COMPLETED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    await queryDb(
      `UPDATE featurerequest SET
        status = ?, adminRemarks = ?, reviewedById = ?, reviewedByName = ?, reviewedAt = NOW(), updatedAt = NOW()
       WHERE id = ?`,
      [
        status,
        adminRemarks || null,
        authUser.id,
        (authUser as any).name || authUser.email,
        id,
      ]
    );

    await logAuditEvent(
      authUser.id,
      "FEATURE_REQUEST_STATUS_UPDATED",
      `Admin ${authUser.email} updated feature request (${id}) status to '${status}'`,
      request.headers.get("x-forwarded-for") || "127.0.0.1"
    );

    return NextResponse.json({
      success: true,
      message: `✓ Feature request status updated to ${status}.`,
    });
  } catch (err: any) {
    console.error("Feature Request PUT Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to update feature request." }, { status: 500 });
  }
}
