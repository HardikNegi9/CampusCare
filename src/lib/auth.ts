import jwt, { JwtPayload } from "jsonwebtoken";

// ✅ Define roles
export type UserRole = "admin" | "engineer" | "faculty";

// ✅ Payload stored in JWT
export interface AuthPayload extends JwtPayload {
  id: string;     // user ID
  role: UserRole; // role of the user
}

// ✅ Secret key from .env
const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("❌ Please define JWT_SECRET in .env");
}

// 🔹 Generate JWT
export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

// 🔹 Verify JWT
export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}
