import { NextRequest, NextResponse } from "next/server";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Retrieve customer reviews & ratings with summary metrics from TiDB Cloud
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const token = searchParams.get("token");

    let query = "SELECT * FROM customerreview WHERE 1=1";
    const params: any[] = [];

    if (token) {
      query += " AND (shareableToken = ? OR id = ?)";
      params.push(token, token);
    } else if (employeeId) {
      query += " AND employeeId = ?";
      params.push(employeeId);
    } else if (userId) {
      query += " AND (userId = ? OR employeeId = ?)";
      params.push(userId, userId);
    }

    if (status && status !== "ALL") {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY createdAt DESC";

    const rows: any = await queryDb(query, params);

    // Calculate aggregated metrics
    const totalReviews = rows.length;
    let avgRating = 5.0;
    let avgCommunication = 5.0;
    let avgCodeQuality = 5.0;
    let avgTimeliness = 5.0;
    let fiveStarCount = 0;
    let fourStarCount = 0;
    let threeStarCount = 0;
    let twoStarCount = 0;
    let oneStarCount = 0;

    if (totalReviews > 0) {
      const sumRating = rows.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0);
      const sumComm = rows.reduce((acc: number, r: any) => acc + (Number(r.communicationRating) || 5), 0);
      const sumCode = rows.reduce((acc: number, r: any) => acc + (Number(r.codeQualityRating) || 5), 0);
      const sumTime = rows.reduce((acc: number, r: any) => acc + (Number(r.timelinessRating) || 5), 0);

      avgRating = Number((sumRating / totalReviews).toFixed(1));
      avgCommunication = Number((sumComm / totalReviews).toFixed(1));
      avgCodeQuality = Number((sumCode / totalReviews).toFixed(1));
      avgTimeliness = Number((sumTime / totalReviews).toFixed(1));

      rows.forEach((r: any) => {
        const star = Math.round(Number(r.rating) || 5);
        if (star >= 5) fiveStarCount++;
        else if (star === 4) fourStarCount++;
        else if (star === 3) threeStarCount++;
        else if (star === 2) twoStarCount++;
        else oneStarCount++;
      });
    }

    const satisfactionRate =
      totalReviews > 0
        ? Math.round(((fiveStarCount + fourStarCount) / totalReviews) * 100)
        : 100;

    return NextResponse.json({
      success: true,
      count: totalReviews,
      metrics: {
        totalReviews,
        avgRating,
        avgCommunication,
        avgCodeQuality,
        avgTimeliness,
        satisfactionRate,
        breakdown: {
          5: fiveStarCount,
          4: fourStarCount,
          3: threeStarCount,
          2: twoStarCount,
          1: oneStarCount,
        },
      },
      data: rows,
    });
  } catch (error: any) {
    console.error("Reviews GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customer reviews." },
      { status: 500 }
    );
  }
}

// POST: Submit a new verified client review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employeeId,
      employeeName,
      userId,
      customerName,
      customerEmail,
      customerCompany,
      customerRole,
      projectId,
      projectName,
      rating,
      communicationRating,
      codeQualityRating,
      timelinessRating,
      reviewTitle,
      feedbackText,
      highlights,
      serviceCategory,
      shareableToken,
    } = body;

    if (!customerName || !feedbackText || !employeeId) {
      return NextResponse.json(
        { success: false, error: "Please provide Client Name, Employee ID, and Feedback comments." },
        { status: 400 }
      );
    }

    const reviewId = `REV-${Date.now()}`;
    const initials = (customerName || "CL")
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    await queryDb(
      `INSERT INTO customerreview (
        id, employeeId, employeeName, userId, customerName, customerEmail,
        customerCompany, customerRole, projectId, projectName, rating,
        communicationRating, codeQualityRating, timelinessRating, reviewTitle,
        feedbackText, highlights, serviceCategory, status, verifiedByClient,
        clientAvatar, shareableToken, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        reviewId,
        employeeId,
        employeeName || "Employee",
        userId || null,
        customerName.trim(),
        customerEmail || "",
        customerCompany || "Client Organization",
        customerRole || "Project Stakeholder",
        projectId || null,
        projectName || "Custom Milestone Deliverables",
        Number(rating) || 5,
        Number(communicationRating) || 5,
        Number(codeQualityRating) || 5,
        Number(timelinessRating) || 5,
        reviewTitle || "Exceptional Project Execution",
        feedbackText.trim(),
        highlights || "On-Time • Great Quality • Highly Recommended",
        serviceCategory || "Full-Stack Development",
        "PUBLISHED",
        1,
        initials,
        shareableToken || `token-${Date.now()}`,
      ]
    );

    return NextResponse.json({
      success: true,
      message: `✓ Thank you! Review submitted successfully for ${employeeName || employeeId}.`,
      reviewId,
    });
  } catch (error: any) {
    console.error("Reviews POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit customer review." },
      { status: 500 }
    );
  }
}
