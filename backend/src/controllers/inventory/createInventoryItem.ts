import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function createInventoryItemController(c: Context) {
  try {
    const data = await c.req.json() as Validator["CreateInventoryItem"];
    const user = getAuthUser(c)!;

    const productId = idParser.decode(data.productId);
    const warehouseId = idParser.decode(data.warehouseId);

    if (productId === null) {
      return c.json({ success: false, message: "Invalid product ID" }, 400);
    }
    if (warehouseId === null) {
      return c.json({ success: false, message: "Invalid warehouse ID" }, 400);
    }

    const existing = await prisma.inventoryItem.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
    });

    if (existing) {
      return c.json({ success: false, message: "Inventory item already exists for this product/warehouse combination" }, 409);
    }

    // Cross-field business logic validation
    const availableQty = data.availableQuantity ?? 0;
    const reservedQty = data.reservedQuantity ?? 0;
    const minLevel = data.minimumStockLevel ?? 0;
    const maxLevel = data.maximumStockLevel;
    const reorderPt = data.reorderPoint;

    if (maxLevel !== undefined) {
      if (maxLevel <= minLevel) {
        return c.json({ success: false, message: "Maximum stock level must be greater than minimum stock level" }, 400);
      }
      if (availableQty > maxLevel) {
        return c.json({ success: false, message: `Available quantity (${availableQty}) cannot exceed maximum stock level (${maxLevel})` }, 400);
      }
    }
    if (reorderPt !== undefined) {
      if (reorderPt < minLevel) {
        return c.json({ success: false, message: "Reorder point cannot be less than minimum stock level" }, 400);
      }
      if (maxLevel !== undefined && reorderPt > maxLevel) {
        return c.json({ success: false, message: "Reorder point cannot exceed maximum stock level" }, 400);
      }
    }
    if (reservedQty > availableQty) {
      return c.json({ success: false, message: "Reserved quantity cannot exceed available quantity" }, 400);
    }

    const item = await prisma.inventoryItem.create({
      data: {
        productId,
        warehouseId,
        availableQuantity: data.availableQuantity ?? 0,
        reservedQuantity: data.reservedQuantity ?? 0,
        damagedQuantity: data.damagedQuantity ?? 0,
        minimumStockLevel: data.minimumStockLevel ?? 0,
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
      action: "CREATE",
      entityType: "InventoryItem",
      entityId: item.id,
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

    return c.json({ success: true, data: responseItem }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
