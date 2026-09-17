import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";
import { rejectedEmail, sendEmail } from "../../lib/email";
import type { Validator } from "../../validators";

export async function rejectUserController(c: Context) {
  try {
    const id = idParser.decode(c.req.param("id"));
    if (id === null) return c.json({ success: false, message: "Invalid user ID" }, 400);

    const data = ((c.req as any).valid?.("json") ?? await c.req.json()) as Validator["RejectUser"];
    const reason = data?.reason?.trim() || null;
    const authUser = getAuthUser(c)!;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return c.json({ success: false, message: "User not found" }, 404);
    if (user.id === authUser.id) {
      return c.json({ success: false, message: "You cannot reject your own account" }, 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        accountStatus: "REJECTED",
        isActive: false,
        rejectionReason: reason,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        emailVerified: true,
        accountStatus: true,
        rejectionReason: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
    });

    await prisma.session.deleteMany({ where: { userId: id } });

    const mail = rejectedEmail(updated.name, reason);
    await sendEmail({ to: updated.email, ...mail });

    await createAuditLog({
      userId: authUser.id,
      action: "UPDATE",
      entityType: "User",
      entityId: id,
      oldValues: { accountStatus: user.accountStatus, isActive: user.isActive },
      newValues: { accountStatus: "REJECTED", isActive: false, rejectionReason: reason },
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({
      success: true,
      message: "User rejected",
      data: {
        ...updated,
        id: idParser.encode(updated.id),
        role: updated.role ? { ...updated.role, id: idParser.encode(updated.role.id) } : null,
      },
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
