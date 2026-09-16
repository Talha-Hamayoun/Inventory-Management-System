import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function updateInventoryItemController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const data = await c.req.json() as Validator["UpdateInventoryItem"];
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid inventory item ID" }, 400);
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ success: false, message: "Inventory item not found" }, 404);
    }

    // Cross-field business logic validation (merge incoming values with existing)
    const effectiveAvailable = data.availableQuantity ?? existing.availableQuantity;
    const effectiveReserved = data.reservedQuantity ?? existing.reservedQuantity;
    const effectiveMinLevel = data.minimumStockLevel ?? existing.minimumStockLevel;
    const effectiveMaxLevel = data.maximumStockLevel !== undefined ? data.maximumStockLevel : (existing.maximumStockLevel ?? undefined);
    const effectiveReorderPt = data.reorderPoint !== undefined ? data.reorderPoint : (existing.reorderPoint ?? undefined);

    if (effectiveMaxLevel !== undefined) {
      if (effectiveMaxLevel <= effectiveMinLevel) {
        return c.json({ success: false, message: "Maximum stock level must be greater than minimum stock level" }, 400);
      }
      if (effectiveAvailable > effectiveMaxLevel) {
        return c.json({ success: false, message: `Available quantity (${effectiveAvailable}) cannot exceed maximum stock level (${effectiveMaxLevel})` }, 400);
      }
    }
    if (effectiveReorderPt !== undefined) {
      if (effectiveReorderPt < effectiveMinLevel) {
        return c.json({ success: false, message: "Reorder point cannot be less than minimum stock level" }, 400);
      }
      if (effectiveMaxLevel !== undefined && effectiveReorderPt > effectiveMaxLevel) {
        return c.json({ success: false, message: "Reorder point cannot exceed maximum stock level" }, 400);
      }
    }
    if (effectiveReserved > effectiveAvailable) {
      return c.json({ success: false, message: "Reserved quantity cannot exceed available quantity" }, 400);
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        availableQuantity: data.availableQuantity,
        reservedQuantity: data.reservedQuantity,
        damagedQuantity: data.damagedQuantity,
        minimumStockLevel: data.minimumStockLevel,
        maximumStockLevel: data.maximumStockLevel,
        reorderPoint: data.reorderPoint,
        lastRestockedAt: data.lastRestockedAt ? new Date(data.lastRestockedAt) : undefined,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "InventoryItem",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const responseItem = {
      ...item,
      id: idParser.encode(item.id),
      product: {
        ...item.product,
        id: idParser.encode(item.product.id),
      },
      warehouse: {
        ...item.warehouse,
        id: idParser.encode(item.warehouse.id),
      },
    };

    return c.json({ success: true, data: responseItem });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
