import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "oms-enterprise-super-secret-key-2026";
export const SESSION_MAX_AGE_SECONDS = 60 * 60; // 1 Hour Inactivity Expiry (3600s)

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: { id: string; email: string; role: string; lastActive?: number }): string {
  return jwt.sign(
    {
      ...payload,
      lastActive: Date.now(),
    },
    JWT_SECRET,
    { expiresIn: "1h" } // Strict 1-Hour Inactivity Expiry
  );
}

export function verifyToken(token: string): any {
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    // Double check: if lastActive exists and is older than 1 hour (3600s), reject
    if (decoded && decoded.lastActive) {
      const elapsed = Date.now() - decoded.lastActive;
      if (elapsed > SESSION_MAX_AGE_SECONDS * 1000) {
        return null; // Session expired due to inactivity
      }
    }
    return decoded;
  } catch (error) {
    return null;
  }
}
