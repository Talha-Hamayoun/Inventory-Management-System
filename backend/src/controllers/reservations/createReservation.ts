import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function createReservationController(c: Context) {
  try {
    const data = await c.req.json() as Validator["CreateStockReservation"];
    const user = getAuthUser(c)!;

    const productId = idParser.decode(data.productId);
    const warehouseId = idParser.decode(data.warehouseId);
    const orderId = data.orderId;

    if (productId === null) {
      return c.json({ success: false, message: "Invalid product ID" }, 400);
    }
    if (warehouseId === null) {
      return c.json({ success: false, message: "Invalid warehouse ID" }, 400);
    }

    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: {
        productId_warehouseId: {
          productId: productId,
          warehouseId: warehouseId,
        },
      },
    });

    if (!inventoryItem) {
      return c.json({ success: false, message: "No inventory found for this product/warehouse" }, 404);
    }

    const availableForReservation =
      inventoryItem.availableQuantity - inventoryItem.reservedQuantity;

    if (availableForReservation < data.quantity) {
      return c.json(
        {
          success: false,
          message: "Insufficient stock",
          available: availableForReservation,
          requested: data.quantity,
        },
        400
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          reservedQuantity: inventoryItem.reservedQuantity + data.quantity,
        },
      });

      const reservation = await tx.stockReservation.create({
        data: {
          orderId: orderId,
          productId: productId,
          warehouseId: warehouseId,
          quantity: data.quantity,
          status: "RESERVED",
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
        },
      });

      return reservation;
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entityType: "StockReservation",
      entityId: result.id,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({ success: true, data: result }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
