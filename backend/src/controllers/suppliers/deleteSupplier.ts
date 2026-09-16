import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function deleteSupplierController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid supplier ID" }, 400);
    }

    const existing = await prisma.supplier.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      return c.json({ success: false, message: "Supplier not found" }, 404);
    }

    await prisma.supplier.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entityType: "Supplier",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({ success: true, message: "Supplier deleted successfully" });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
