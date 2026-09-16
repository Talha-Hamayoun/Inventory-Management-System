import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function createRoleController(c: Context) {
  try {
    const data = await c.req.json() as Validator["CreateRole"];
    const user = getAuthUser(c)!;

    const role = await prisma.role.create({
      data: { name: data.name, permissions: data.permissions },
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entityType: "Role",
      entityId: role.id,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const responseRole = {
      ...role,
      id: idParser.encode(role.id),
    };
    return c.json({ success: true, data: responseRole }, 201);
  } catch (error) {
    console.error("Error creating role:", error);
    return c.json({ success: false, message: "Server error" }, 500);
  }
}
