import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH: Add employee/admin response comment or update review status on TiDB Cloud
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { responseComment, status, highlights } = body;

    const existing: any = await queryDb("SELECT * FROM customerreview WHERE id = ? LIMIT 1", [id]);
    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: "Review record not found." }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (responseComment !== undefined) {
      updates.push("responseComment = ?, respondedAt = NOW()");
      values.push(responseComment);
    }

    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }

    if (highlights !== undefined) {
      updates.push("highlights = ?");
      values.push(highlights);
    }

    if (updates.length > 0) {
      values.push(id);
      await queryDb(`UPDATE customerreview SET ${updates.join(", ")}, updatedAt = NOW() WHERE id = ?`, values);
    }

    return NextResponse.json({
      success: true,
      message: "✓ Review updated successfully in TiDB Cloud.",
    });
  } catch (error: any) {
    console.error("Review PATCH Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update review." },
      { status: 500 }
    );
  }
}

// DELETE: Remove customer review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await queryDb("DELETE FROM customerreview WHERE id = ?", [id]);
    return NextResponse.json({
      success: true,
      message: "✓ Customer review removed from TiDB Cloud.",
    });
  } catch (error: any) {
    console.error("Review DELETE Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete review." },
      { status: 500 }
    );
  }
}
