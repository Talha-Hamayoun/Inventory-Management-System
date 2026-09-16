import { Context } from "hono";
import { hash } from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function updateUserController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const data = await c.req.json() as Validator["UpdateUser"];
    const authUser = getAuthUser(c)!;
    if (id === null) {
      return c.json({ success: false, message: "Invalid user ID" }, 400);
    }
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ success: false, message: "User not found" }, 404);
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.password) {
      updateData.password = await hash(data.password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: authUser.id,
      action: "UPDATE",
      entityType: "User",
      entityId: id,
      oldValues: { ...existing, password: "[REDACTED]" },
      newValues: { ...data, password: data.password ? "[REDACTED]" : undefined },
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const responseUser = {
      ...user,
      id: idParser.encode(user.id),
      role: user.role ? {
        ...user.role,
        id: idParser.encode(user.role.id),
      } : null,
    };
    return c.json({ success: true, data: responseUser });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
