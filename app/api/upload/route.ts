import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authMiddleware";
import {
  getCloudinaryConfig,
  uploadBufferToCloudinary,
  deleteCloudinaryAsset,
  extractPublicIdFromUrl,
  resolveCloudinaryFolder,
} from "@/lib/cloudinary";
import { queryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// Blocked dangerous/executable extensions
const FORBIDDEN_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".sh", ".vbs", ".js", ".mjs", ".dll", ".bin",
  ".msi", ".scr", ".jar", ".jsp", ".php", ".py", ".com", ".pif", ".application", ".gadget"
];

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

// Allowed document MIME types
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You must be logged in to upload files." },
        { status: 401 }
      );
    }

    const authUser = authResult.user;

    // 2. Parse Multipart Form Data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string || "general").toLowerCase().trim();
    const requestedTargetUserId = formData.get("targetUserId") as string | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "No file provided. Please attach a valid file in the 'file' field." },
        { status: 400 }
      );
    }

    const originalName = file.name || "unnamed-file";
    const lowerName = originalName.toLowerCase();

    // 3. Security: Check for forbidden executable file extensions
    const isDangerous = FORBIDDEN_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (isDangerous) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Executable and script files cannot be uploaded." },
        { status: 400 }
      );
    }

    // 4. Validate File Size
    const isImage = file.type.startsWith("image/") || ALLOWED_IMAGE_TYPES.includes(file.type);
    const isDocument = ALLOWED_DOC_TYPES.includes(file.type) || lowerName.endsWith(".pdf");

    const maxSizeBytes = isImage ? 10 * 1024 * 1024 : 25 * 1024 * 1024; // 10MB for images, 25MB for docs/media
    if (file.size > maxSizeBytes) {
      const maxMb = isImage ? 10 : 25;
      return NextResponse.json(
        { success: false, error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of ${maxMb} MB.` },
        { status: 400 }
      );
    }

    // 5. Authorize User Ownership & Folder Categorization
    const adminRoles = ["SUPER_ADMIN", "DIRECTOR", "ADMIN_HR", "HR"];
    let targetUserId = authUser.id;

    if (category === "avatar") {
      if (requestedTargetUserId && requestedTargetUserId !== authUser.id) {
        if (!adminRoles.includes(authUser.role)) {
          return NextResponse.json(
            { success: false, error: "Forbidden: You cannot modify another user's avatar." },
            { status: 403 }
          );
        }
        targetUserId = requestedTargetUserId;
      }
    }

    // 6. Check Cloudinary Configuration
    const cloudinaryConfig = getCloudinaryConfig();
    if (!cloudinaryConfig.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "Cloudinary cloud storage is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server environment variables.",
          isConfigured: false,
        },
        { status: 503 }
      );
    }

    // 7. Process Buffer and Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let folderPath = "";
    if (category === "projects" && projectId) {
      folderPath = resolveCloudinaryFolder("projects", projectId);
    } else {
      folderPath = resolveCloudinaryFolder(category, targetUserId);
    }

    const resourceType = isImage ? "image" : isDocument ? "raw" : "auto";

    const uploadResult = await uploadBufferToCloudinary(buffer, {
      folder: folderPath,
      resource_type: resourceType,
    });

    // 8. Special Automation for Avatars: Replace & Cleanup Old Cloudinary Image
    if (category === "avatar") {
      try {
        const userRows = await queryDb<any[]>(`SELECT avatarUrl FROM user WHERE id = ? LIMIT 1`, [targetUserId]);
        const oldAvatarUrl = userRows && userRows.length > 0 ? userRows[0].avatarUrl : null;

        // Update database with new Cloudinary URL
        await queryDb(`UPDATE user SET avatarUrl = ?, updatedAt = NOW() WHERE id = ?`, [
          uploadResult.secure_url,
          targetUserId,
        ]);

        // Safely delete old Cloudinary asset if it exists and was replaced
        if (oldAvatarUrl && oldAvatarUrl.includes("res.cloudinary.com")) {
          const oldPublicId = extractPublicIdFromUrl(oldAvatarUrl);
          if (oldPublicId && oldPublicId !== uploadResult.public_id) {
            deleteCloudinaryAsset(oldPublicId).catch((err) =>
              console.warn("Old avatar cleanup warning:", err.message)
            );
          }
        }
      } catch (dbErr: any) {
        console.warn("Avatar DB update warning:", dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully to Cloudinary cloud storage.",
      url: uploadResult.secure_url,
      secure_url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      public_id: uploadResult.public_id,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      resourceType: uploadResult.resource_type,
      fileName: originalName,
    });
  } catch (error: any) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file to Cloudinary." },
      { status: 500 }
    );
  }
}