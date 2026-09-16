import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function deleteInventoryItemController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid inventory item ID" }, 400);
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ success: false, message: "Inventory item not found" }, 404);
    }

    if (existing.reservedQuantity > 0) {
      return c.json({
        success: false,
        message: "Cannot delete inventory item with reserved stock. Release reservations first.",
      }, 409);
    }

    await prisma.inventoryItem.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entityType: "InventoryItem",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({ success: true, message: "Inventory item deleted successfully" });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
