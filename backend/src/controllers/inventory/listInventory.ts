import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listInventoryController(c: Context) {
  try {
    const { page, limit, search, warehouseId, productId, lowStock } = (c.req as any).valid("query") as Validator["InventoryQuery"];
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (warehouseId) {
      const decodedWarehouseId = idParser.decode(warehouseId);
      if (decodedWarehouseId === null) {
        return c.json({ success: false, message: "Invalid warehouse ID" }, 400);
      }
      where.warehouseId = decodedWarehouseId;
    }
    if (productId) {
      const decodedProductId = idParser.decode(productId);
      if (decodedProductId === null) {
        return c.json({ success: false, message: "Invalid product ID" }, 400);
      }
      where.productId = decodedProductId;
    }
    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (lowStock) {
      const lowStockIds = await prisma.$queryRaw<{ id: number }[]>`
        SELECT id FROM "InventoryItem"
        WHERE (
          ("reorderPoint" IS NOT NULL AND "availableQuantity" <= "reorderPoint")
          OR
          ("reorderPoint" IS NULL AND "minimumStockLevel" > 0 AND "availableQuantity" <= "minimumStockLevel")
        )
      `;
      where.id = { in: lowStockIds.map(i => i.id) };
    }

    const [data, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true, barcode: true, unitOfMeasure: true } },
          warehouse: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    const encodedData = data.map(item => ({
      ...item,
      itemNumber: `INV-${String(item.id).padStart(6, "0")}`,
      id: idParser.encode(item.id),
      product: {
        ...item.product,
        id: idParser.encode(item.product.id),
      },
      warehouse: {
        ...item.warehouse,
        id: idParser.encode(item.warehouse.id),
      },
    }));

    return c.json({
      success: true,
      data: encodedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
