import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function deleteUserController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const authUser = getAuthUser(c)!;
    if (id === null) {
      return c.json({ success: false, message: "Invalid user ID" }, 400);
    }
    if (id === authUser.id) {
      return c.json({ success: false, message: "Cannot deactivate your own account" }, 400);
    }
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    await prisma.session.deleteMany({ where: { userId: id } });
    await createAuditLog({
      userId: authUser.id,
      action: "DELETE",
      entityType: "User",
      entityId: id,
      oldValues: { isActive: existing.isActive },
      newValues: { isActive: false },
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });
    return c.json({ success: true, message: "User deactivated successfully" });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
