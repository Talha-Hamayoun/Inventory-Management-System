import { Context } from "hono";
import { idParser } from "../../helpers/idParser";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";

export async function toggleWarehouseStatusController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid warehouse ID" }, 400);
    }

    const existing = await prisma.warehouse.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      return c.json({ success: false, message: "Warehouse not found" }, 404);
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "Warehouse",
      entityId: id,
      oldValues: { isActive: existing.isActive },
      newValues: { isActive: warehouse.isActive },
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const responseWarehouse = {
      ...warehouse,
      id: idParser.encode(warehouse.id),
    };

    return c.json({ success: true, data: responseWarehouse });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
