import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function deleteCustomerController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid customer ID" }, 400);
    }

    const existing = await prisma.customer.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return c.json({ success: false, message: "Customer not found" }, 404);
    }

    await prisma.customer.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entityType: "Customer",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
