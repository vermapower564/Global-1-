import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult.response || !authResult.user) {
      return authResult.response || NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const requiredSkillsParam = searchParams.get("skills") || "";

    // 1. If projectId given, fetch project's requiredSkills
    let projectRequiredSkills: string[] = [];
    if (projectId) {
      const projRows = await queryDb<any[]>(
        `SELECT id, projectTitle, requiredSkills, techStack FROM project WHERE id = ? LIMIT 1`,
        [projectId]
      );
      if (projRows && projRows.length > 0) {
        const p = projRows[0];
        const rawSkills = (p.requiredSkills || p.techStack || "").toLowerCase();
        projectRequiredSkills = rawSkills
          .split(/[,;\n]+/)
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
    }

    if (requiredSkillsParam && projectRequiredSkills.length === 0) {
      projectRequiredSkills = requiredSkillsParam
        .toLowerCase()
        .split(/[,;\n]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    // Default fallback skills if none specified
    if (projectRequiredSkills.length === 0) {
      projectRequiredSkills = ["react", "next.js", "node.js", "mysql", "ui/ux"];
    }

    // 2. Fetch all active employees
    const employees: any[] = await queryDb<any[]>(
      `SELECT u.id, u.employeeId, u.name, u.email, u.phone, u.role, u.skills, u.experienceYears, u.avatarUrl,
              d.name AS departmentName
       FROM user u
       LEFT JOIN department d ON u.departmentId = d.id
       WHERE u.isActive = 1 AND u.role NOT IN ('SUPER_ADMIN', 'DIRECTOR')
       ORDER BY u.name ASC`
    );

    // 3. Fetch active tasks for workload calculation
    const allTasks: any[] = await queryDb<any[]>(
      `SELECT id, assignedToUserId, status FROM task WHERE status IN ('IN_PROGRESS', 'ASSIGNED', 'IN_REVIEW', 'BLOCKED')`
    );

    // 4. Compute recommendation scores for each employee
    const recommendations = (employees || []).map((emp) => {
      const empSkillsStr = (emp.skills || "React, JavaScript, HTML, CSS").toLowerCase();
      const empSkillList = empSkillsStr.split(/[,;\n]+/).map((s: string) => s.trim());

      // Skill match percentage
      let matchedCount = 0;
      const matchedSkills: string[] = [];
      const missingSkills: string[] = [];

      projectRequiredSkills.forEach((req) => {
        const found = empSkillList.some((s: string) => s.includes(req) || req.includes(s));
        if (found) {
          matchedCount++;
          matchedSkills.push(req);
        } else {
          missingSkills.push(req);
        }
      });

      const skillMatchScore =
        projectRequiredSkills.length > 0
          ? Math.round((matchedCount / projectRequiredSkills.length) * 100)
          : 70;

      // Workload calculation
      const activeTasksCount = (allTasks || []).filter((t) => t.assignedToUserId === emp.id).length;
      const currentWorkload = Math.min(100, activeTasksCount * 20); // Each active task = 20% load
      const availableCapacity = Math.max(0, 100 - currentWorkload);

      // Workload status
      let workloadStatus: "AVAILABLE" | "OPTIMAL" | "HIGH_LOAD" | "OVERLOADED" = "OPTIMAL";
      if (currentWorkload <= 20) workloadStatus = "AVAILABLE";
      else if (currentWorkload <= 60) workloadStatus = "OPTIMAL";
      else if (currentWorkload <= 80) workloadStatus = "HIGH_LOAD";
      else workloadStatus = "OVERLOADED";

      // Performance rating approximation
      const expYears = Number(emp.experienceYears) || 2.0;
      const performanceScore = Math.min(98, Math.max(75, Math.round(80 + expYears * 3)));

      // Recommendation composite score:
      // Skill Match: 50%, Capacity: 30%, Performance: 20%
      const matchScore = Math.round(
        skillMatchScore * 0.50 +
        (availableCapacity / 100) * 100 * 0.30 +
        performanceScore * 0.20
      );

      const isRecommended = matchScore >= 70 && currentWorkload <= 80;

      return {
        id: emp.id,
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        department: emp.departmentName || "Engineering",
        avatarUrl: emp.avatarUrl,
        skills: emp.skills || "React, Next.js, Node.js",
        experienceYears: expYears,
        skillMatchScore,
        matchedSkills,
        missingSkills,
        currentWorkload,
        availableCapacity,
        workloadStatus,
        performanceScore,
        matchScore,
        isRecommended,
      };
    });

    // Sort by matchScore DESC
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      success: true,
      requiredSkills: projectRequiredSkills,
      total: recommendations.length,
      recommendations,
    });
  } catch (err: any) {
    console.error("Recommendations GET Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to generate recommendations." }, { status: 500 });
  }
}
