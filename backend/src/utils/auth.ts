import { sign, verify } from "hono/jwt";
import type { Context } from "hono";
import { idParser } from "@/helpers/idParser";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRY_DAYS = parseInt(process.env.JWT_EXPIRY_DAYS || "7");

export interface JWTPayload {
  userId: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  exp: number;
}

export async function generateToken(user: {
  id: number;
  email: string;
  roleId: number;
  role: { name: string; permissions: unknown };
}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 60 * 60 * 24 * JWT_EXPIRY_DAYS;

  const payload: JWTPayload = {
    userId: idParser.encode(user.id),
    email: user.email,
    roleId: idParser.encode(user.roleId),
    roleName: user.role.name,
    permissions: user.role.permissions as string[],
    exp: now + expiresIn,
  };

  const token = await sign({ ...payload }, JWT_SECRET);

  return { token, expiresAt: new Date((now + expiresIn) * 1000) };
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const payload = await verify(token, JWT_SECRET, "HS256");
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function getAuthUser(c: Context) {
  return c.get("user")
}

export function hasPermission(user: JWTPayload, permission: string): boolean {
  return user.permissions.includes(permission) || user.permissions.includes("*");
}

export function hasAnyPermission(user: JWTPayload, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}
