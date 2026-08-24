export interface DecodedJWTPayload {
  id: string;
  email?: string;
  role?: string;
  lastActive?: number;
  exp?: number;
  iat?: number;
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  if (typeof atob === "function") {
    return atob(base64);
  }
  return Buffer.from(base64, "base64").toString("binary");
}

function base64UrlToUint8Array(str: string): Uint8Array {
  const binary = base64UrlDecode(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function verifyJwtEdge(token: string, secret?: string): Promise<DecodedJWTPayload | null> {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(base64UrlDecode(headerB64));
    if (header.alg !== "HS256") return null;

    const payload: DecodedJWTPayload = JSON.parse(base64UrlDecode(payloadB64));

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    if (payload.lastActive && Date.now() - payload.lastActive > 3600 * 1000) {
      return null;
    }

    const jwtSecret = secret || process.env.JWT_SECRET || "oms-enterprise-super-secret-key-2026";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToUint8Array(signatureB64);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature as any,
      data
    );

    if (!isValid) return null;
    return payload;
  } catch {
    return null;
  }
}
