import { idParser } from "@/helpers/idParser";
import { prisma } from "@/lib/prisma";
import { JsonValue } from "@prisma/client/runtime/client";
import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verifyToken } from "../utils/auth";

declare module "hono" {
  interface ContextVariableMap {
    user: {
      id: number;
      name: string;
      createdAt: Date;
      updatedAt: Date;
      email: string;
      password: string;
      roleId: number;
      isActive: boolean;
      role: {
        name: string;
        id: number;
        permissions: JsonValue;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

export async function authenticate(c: Context, next: Next) {

  let token = getCookie(c, "token");

  if (!token)
    return c.json({ success: false, message: "Unauthorized: No token provided" }, 401);

  const payload = await verifyToken(token);

  if (!payload)
    return c.json({ success: false, message: "Unauthorized: Invalid or expired token" }, 401);

  const userId = idParser.decode(payload.userId);

  if (userId === null)
    return c.json({ success: false, message: "Unauthorized: Invalid user ID in token" }, 401);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  })

  if (!user || !user.isActive) {
    return c.json({ success: false, message: "Unauthorized: User not found or inactive" }, 401);
  }

  c.set("user", user);
  await next();
}
