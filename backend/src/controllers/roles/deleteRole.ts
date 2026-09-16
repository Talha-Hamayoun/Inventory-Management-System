import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function deleteRoleController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const user = getAuthUser(c)!;
    if (id === null) {
      return c.json({ success: false, message: "Invalid role ID" }, 400);
    }
    const existing = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!existing) {
      return c.json({ success: false, message: "Role not found" }, 404);
    }

    if (existing._count.users > 0) {
      return c.json({ success: false, message: "Cannot delete role with assigned users" }, 400);
    }

    await prisma.role.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entityType: "Role",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
