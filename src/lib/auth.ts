import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET = process.env.AUTH_SECRET || "dev-secret-change-in-production";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
