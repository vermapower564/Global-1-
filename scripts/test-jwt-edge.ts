import { generateToken } from "../lib/authService";
import { verifyJwtEdge } from "../lib/jwtEdge";

async function testEdgeJwt() {
  console.log("Testing Edge JWT verification...");
  const token = generateToken({
    id: "user-123",
    email: "test@example.com",
    role: "SUPER_ADMIN",
  });
  console.log("Generated Token:", token.substring(0, 30) + "...");

  const verified = await verifyJwtEdge(token);
  console.log("Verified Payload:", verified);

  if (verified && verified.id === "user-123" && verified.role === "SUPER_ADMIN") {
    console.log("✓ Edge JWT verification PASSED successfully!");
  } else {
    console.error("✗ Edge JWT verification FAILED!");
    process.exit(1);
  }
}

testEdgeJwt();
