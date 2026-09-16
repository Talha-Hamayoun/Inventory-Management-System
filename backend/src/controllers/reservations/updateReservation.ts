import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function updateReservationController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const { status } = await c.req.json() as Validator["UpdateStockReservation"];
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid reservation ID" }, 400);
    }

    const reservation = await prisma.stockReservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return c.json({ success: false, message: "Reservation not found" }, 404);
    }

    if (reservation.status !== "RESERVED") {
      return c.json({ success: false, message: "Can only update active reservations" }, 400);
    }

    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: {
        productId_warehouseId: {
          productId: reservation.productId,
          warehouseId: reservation.warehouseId,
        },
      },
    });

    if (!inventoryItem) {
      return c.json({ success: false, message: "Inventory item not found" }, 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      if (status === "RELEASED") {
        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            reservedQuantity: Math.max(0, inventoryItem.reservedQuantity - reservation.quantity),
          },
        });
      } else if (status === "FULFILLED") {
        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            availableQuantity: inventoryItem.availableQuantity - reservation.quantity,
            reservedQuantity: Math.max(0, inventoryItem.reservedQuantity - reservation.quantity),
          },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
            type: "OUT",
            quantity: reservation.quantity,
            referenceType: "ORDER",
            referenceId: reservation.orderId,
            performedBy: user.id,
            notes: `Fulfilled reservation for order ${reservation.orderId}`,
          },
        });
      }

      const updated = await tx.stockReservation.update({
        where: { id },
        data: { status },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
        },
      });

      return updated;
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "StockReservation",
      entityId: id,
      oldValues: { status: reservation.status },
      newValues: { status },
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
