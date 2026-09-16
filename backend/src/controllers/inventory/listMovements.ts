import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listMovementsController(c: Context) {
  try {
    const { page, limit, warehouseId, productId, type, startDate, endDate } = (c.req as any).valid("query") as Validator["MovementQuery"];
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
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
          performedByUser: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    const encodedData = data.map(movement => ({
      ...movement,
      id: idParser.encode(movement.id),
      product: {
        ...movement.product,
        id: idParser.encode(movement.product.id),
      },
      warehouse: {
        ...movement.warehouse,
        id: idParser.encode(movement.warehouse.id),
      },
      performedByUser: movement.performedByUser ? {
        ...movement.performedByUser,
        id: idParser.encode(movement.performedByUser.id),
      } : null,
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
