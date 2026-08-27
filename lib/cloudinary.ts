import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from "cloudinary";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  isConfigured: boolean;
}

/**
 * Loads and validates Cloudinary configuration strictly from server environment variables.
 * Never exposes credentials to client-side code.
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  const isConfigured = Boolean(cloudName && apiKey && apiSecret);

  if (isConfigured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    isConfigured,
  };
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  resource_type: string;
  width?: number;
  height?: number;
}

export interface UploadOptions {
  folder: string;
  resource_type?: "auto" | "image" | "raw" | "video";
  public_id?: string;
  overwrite?: boolean;
  tags?: string[];
  transformation?: any;
}

/**
 * Uploads a Buffer to Cloudinary via upload_stream.
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer | Uint8Array,
  options: UploadOptions
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig();
  if (!config.isConfigured) {
    throw new Error(
      "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment variables."
    );
  }

  const uploadOptions: UploadApiOptions = {
    folder: options.folder,
    resource_type: options.resource_type || "auto",
    type: "upload", // Explicit permanent cloud storage type (no auto-expiry)
    overwrite: options.overwrite ?? true,
    tags: options.tags || ["oms-enterprise", "permanent-storage"],
  };

  if (options.public_id) {
    uploadOptions.public_id = options.public_id;
  }

  if (options.transformation) {
    uploadOptions.transformation = options.transformation;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: any, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          console.error("❌ Cloudinary upload error:", error);
          return reject(error || new Error("Failed to receive Cloudinary response."));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format || "unknown",
          bytes: result.bytes,
          resource_type: result.resource_type,
          width: result.width,
          height: result.height,
        });
      }
    );

    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    uploadStream.end(buf);
  });
}

/**
 * Safely extracts Cloudinary public_id from a Cloudinary secure_url.
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return null;
  }

  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const afterUpload = parts[1];
    // Remove version tag if present e.g. v1234567890/
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    // Remove file extension e.g. .jpg, .png, .pdf
    const lastDotIdx = withoutVersion.lastIndexOf(".");
    return lastDotIdx !== -1 ? withoutVersion.substring(0, lastDotIdx) : withoutVersion;
  } catch {
    return null;
  }
}

/**
 * Deletes an asset from Cloudinary by public_id.
 */
export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: "image" | "raw" | "video" = "image"
): Promise<{ success: boolean; result?: string; error?: string }> {
  const config = getCloudinaryConfig();
  if (!config.isConfigured) {
    return { success: false, error: "Cloudinary is not configured." };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    return { success: result.result === "ok" || result.result === "not found", result: result.result };
  } catch (error: any) {
    console.error(`❌ Cloudinary deletion error for [${publicId}]:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Resolves structured folder path by category and entity ID.
 */
export function resolveCloudinaryFolder(category: string, entityId?: string): string {
  const sanitizedId = (entityId || "common").replace(/[^a-zA-Z0-9_-]/g, "");
  switch (category) {
    case "avatar":
      return `oms/users/${sanitizedId}/avatar`;
    case "daily-work":
      return `oms/daily-work/${sanitizedId}`;
    case "leave":
      return `oms/leave/${sanitizedId}`;
    case "design-assets":
      return `oms/design-assets`;
    case "documents":
      return `oms/documents/${sanitizedId}`;
    case "projects":
      return `oms/projects/${sanitizedId}`;
    case "it-assets":
      return `oms/it-assets`;
    default:
      return `oms/general/${sanitizedId}`;
  }
}