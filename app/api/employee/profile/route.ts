import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import { queryDb } from "@/lib/db";
import { validateAndNormalizeGmail } from "@/lib/emailValidator";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in." },
        { status: 401 }
      );
    }

    const rows = await queryDb<any[]>(
      `SELECT u.id, u.employeeId, u.name, u.email, u.phone, u.role, u.departmentId,
              u.joiningDate, u.avatarUrl, u.emergencyContact, u.isProfileCompleted,
              d.name AS departmentName
       FROM user u
       LEFT JOIN department d ON u.departmentId = d.id
       WHERE u.id = ?
       LIMIT 1`,
      [authResult.user.id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const u = rows[0];
    return NextResponse.json({
      success: true,
      user: {
        ...u,
        department: u.departmentName ? { name: u.departmentName } : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  return handleProfileUpdate(request);
}

export async function PUT(request: NextRequest) {
  return handleProfileUpdate(request);
}

async function handleProfileUpdate(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in." },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;
    const body = await request.json();
    const {
      name,
      email,
      phone,
      emergencyContact,
      avatarUrl,
      removeAvatar,
      // Protected fields attempting to be self-modified:
      role,
      salary,
      employeeId,
      departmentId,
      isActive,
      isResigned,
    } = body;

    // 🔒 Reject attempts to tamper with protected administrative fields
    if (
      role !== undefined ||
      salary !== undefined ||
      employeeId !== undefined ||
      departmentId !== undefined ||
      isActive !== undefined ||
      isResigned !== undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Organizational fields (Role, Salary, Employee ID, Department) cannot be modified from user profile.",
        },
        { status: 403 }
      );
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // 1. Name Validation
    if (name !== undefined) {
      const cleanName = name.toString().trim();
      if (!cleanName || cleanName.length < 2) {
        return NextResponse.json(
          { success: false, error: "Name must contain at least 2 characters." },
          { status: 400 }
        );
      }
      updateFields.push("name = ?");
      updateValues.push(cleanName);
    }

    // 2. Email Validation
    if (email !== undefined) {
      const cleanEmail = email.toString().trim().toLowerCase();
      const emailValidation = validateAndNormalizeGmail(cleanEmail);
      if (!emailValidation.isValid) {
        return NextResponse.json(
          { success: false, error: emailValidation.error || "Please enter a valid Gmail address (@gmail.com)." },
          { status: 400 }
        );
      }
      // Check if email already used by another user
      const existingEmail = await queryDb<any[]>(
        `SELECT id FROM user WHERE LOWER(email) = ? AND id != ? LIMIT 1`,
        [emailValidation.normalizedEmail, userId]
      );
      if (existingEmail && existingEmail.length > 0) {
        return NextResponse.json(
          { success: false, error: "This email address is already registered to another account." },
          { status: 400 }
        );
      }
      updateFields.push("email = ?");
      updateValues.push(emailValidation.normalizedEmail);
    }

    // 3. Phone Validation
    if (phone !== undefined) {
      const cleanPhone = phone.toString().trim();
      if (cleanPhone) {
        const phoneRegex = /^[+]?[\d\s-]{10,16}$/;
        if (!phoneRegex.test(cleanPhone)) {
          return NextResponse.json(
            { success: false, error: "Please enter a valid phone number (10 to 15 digits)." },
            { status: 400 }
          );
        }
      }
      updateFields.push("phone = ?");
      updateValues.push(cleanPhone || null);
    }

    // 4. Emergency Contact Validation
    if (emergencyContact !== undefined) {
      updateFields.push("emergencyContact = ?");
      updateValues.push(emergencyContact.toString().trim() || null);
    }

    // 5. Avatar Photo Validation & Processing (Cloudinary Cloud Storage)
    if (removeAvatar === true) {
      const oldRows = await queryDb<any[]>(`SELECT avatarUrl FROM user WHERE id = ? LIMIT 1`, [userId]);
      const oldAvatar = oldRows?.[0]?.avatarUrl;
      if (oldAvatar && oldAvatar.includes("res.cloudinary.com")) {
        const { deleteCloudinaryAsset, extractPublicIdFromUrl } = await import("@/lib/cloudinary");
        const oldPid = extractPublicIdFromUrl(oldAvatar);
        if (oldPid) deleteCloudinaryAsset(oldPid).catch(() => {});
      }
      updateFields.push("avatarUrl = ?");
      updateValues.push(null);
    } else if (avatarUrl !== undefined) {
      let finalAvatarUrl: string | null = avatarUrl ? avatarUrl.toString().trim() : null;

      if (finalAvatarUrl) {
        // If base64 data URL, upload to Cloudinary if configured
        if (finalAvatarUrl.startsWith("data:image/")) {
          const match = finalAvatarUrl.match(/^data:(image\/(jpeg|png|webp|gif|svg\+xml));base64,/);
          if (!match) {
            return NextResponse.json(
              { success: false, error: "Invalid image format. Supported formats: JPEG, PNG, WEBP, GIF, SVG." },
              { status: 400 }
            );
          }
          if (finalAvatarUrl.length > 7 * 1024 * 1024) {
            return NextResponse.json(
              { success: false, error: "Profile photo must be smaller than 5 MB." },
              { status: 400 }
            );
          }

          try {
            const { getCloudinaryConfig, uploadBufferToCloudinary, deleteCloudinaryAsset, extractPublicIdFromUrl } = await import("@/lib/cloudinary");
            const cConfig = getCloudinaryConfig();
            if (cConfig.isConfigured) {
              const base64Data = finalAvatarUrl.split(",")[1];
              const imgBuffer = Buffer.from(base64Data, "base64");
              const uploadRes = await uploadBufferToCloudinary(imgBuffer, {
                folder: `oms/users/${userId}/avatar`,
                resource_type: "image",
              });

              // Check and cleanup old Cloudinary avatar
              const oldRows = await queryDb<any[]>(`SELECT avatarUrl FROM user WHERE id = ? LIMIT 1`, [userId]);
              const oldAvatar = oldRows?.[0]?.avatarUrl;
              if (oldAvatar && oldAvatar.includes("res.cloudinary.com")) {
                const oldPid = extractPublicIdFromUrl(oldAvatar);
                if (oldPid && oldPid !== uploadRes.public_id) {
                  deleteCloudinaryAsset(oldPid).catch(() => {});
                }
              }

              finalAvatarUrl = uploadRes.secure_url;
            }
          } catch (cErr: any) {
            console.warn("Cloudinary avatar upload fallback:", cErr.message);
          }
        }
      }

      updateFields.push("avatarUrl = ?");
      updateValues.push(finalAvatarUrl);
    }

    if (updateFields.length > 0) {
      updateFields.push("updatedAt = NOW()");
      updateValues.push(userId);
      await queryDb(`UPDATE user SET ${updateFields.join(", ")} WHERE id = ?`, updateValues);
    }

    // Fetch and return the fresh updated user
    const updatedRows = await queryDb<any[]>(
      `SELECT u.id, u.employeeId, u.name, u.email, u.phone, u.role, u.departmentId,
              u.joiningDate, u.avatarUrl, u.emergencyContact,
              d.name AS departmentName
       FROM user u
       LEFT JOIN department d ON u.departmentId = d.id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );

    const freshUser = updatedRows[0] || null;

    return NextResponse.json({
      success: true,
      message: "✓ Profile updated successfully!",
      user: freshUser
        ? {
            ...freshUser,
            department: freshUser.departmentName ? { name: freshUser.departmentName } : null,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update profile." },
      { status: 500 }
    );
  }
}

