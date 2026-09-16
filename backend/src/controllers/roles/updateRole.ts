import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function updateRoleController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const data = await c.req.json() as Validator["UpdateRole"];
    const user = getAuthUser(c)!;
    if (id === null) {
      return c.json({ success: false, message: "Invalid role ID" }, 400);
    }
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ success: false, message: "Role not found" }, 404);
    }
    const role = await prisma.role.update({
      where: { id },
      data: { name: data.name, permissions: data.permissions },
    });
    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "Role",
      entityId: role.id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });
    const responseRole = {
      ...role,
      id: idParser.encode(role.id),
    };
    return c.json({ success: true, data: responseRole });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
