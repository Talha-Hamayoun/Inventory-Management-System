import { Context } from "hono";
import { idParser } from "../../helpers/idParser";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";

export async function toggleSupplierStatusController(c: Context) {
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

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "Supplier",
      entityId: id,
      oldValues: { isActive: existing.isActive },
      newValues: { isActive: supplier.isActive },
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const responseSupplier = {
      ...supplier,
      id: idParser.encode(supplier.id),
    };

    return c.json({ success: true, data: responseSupplier });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
