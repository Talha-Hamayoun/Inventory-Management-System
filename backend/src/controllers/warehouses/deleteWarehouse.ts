import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function deleteWarehouseController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const user = getAuthUser(c)!;
    if (id === null) {
      return c.json({ success: false, message: "Invalid warehouse ID" }, 400);
    }
    const existing = await prisma.warehouse.findFirst({
      where: { id, isDeleted: false },
      include: { _count: { select: { inventoryItems: true } } },
    });
    if (!existing) {
      return c.json({ success: false, message: "Warehouse not found" }, 404);
    }
    if (existing._count && existing._count.inventoryItems > 0) {
      return c.json({ success: false, message: "Cannot delete warehouse with inventory items" }, 400);
    }
    await prisma.warehouse.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });
    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entityType: "Warehouse",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });
    return c.json({ success: true, message: "Warehouse deleted successfully" });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
