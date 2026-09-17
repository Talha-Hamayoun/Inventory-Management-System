import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";
import { approvedEmail, sendEmail } from "../../lib/email";

export async function approveUserController(c: Context) {
  try {
    const id = idParser.decode(c.req.param("id"));
    if (id === null) return c.json({ success: false, message: "Invalid user ID" }, 400);

    const authUser = getAuthUser(c)!;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return c.json({ success: false, message: "User not found" }, 404);

    if (!user.emailVerified) {
      return c.json({ success: false, message: "User must verify their email before approval" }, 400);
    }
    if (user.accountStatus === "APPROVED" && user.isActive) {
      return c.json({ success: true, message: "User is already approved" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        accountStatus: "APPROVED",
        isActive: true,
        rejectionReason: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        emailVerified: true,
        accountStatus: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
    });

    const mail = approvedEmail(updated.name);
    await sendEmail({ to: updated.email, ...mail });

    await createAuditLog({
      userId: authUser.id,
      action: "UPDATE",
      entityType: "User",
      entityId: id,
      oldValues: { accountStatus: user.accountStatus, isActive: user.isActive },
      newValues: { accountStatus: "APPROVED", isActive: true },
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({
      success: true,
      message: "User approved",
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
