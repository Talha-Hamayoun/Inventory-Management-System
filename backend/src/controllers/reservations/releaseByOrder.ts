import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function releaseByOrderController(c: Context) {
  try {
    const hashedOrderId = c.req.param("orderId");
    const orderId = idParser.decode(hashedOrderId);
    const user = getAuthUser(c)!;

    if (orderId === null) {
      return c.json({ success: false, message: "Invalid order ID" }, 400);
    }

    const reservationsToRelease = await prisma.stockReservation.findMany({
      where: { orderId, status: "RESERVED" },
    });

    if (reservationsToRelease.length === 0) {
      return c.json({ success: true, message: "No active reservations found for this order" });
    }

    await prisma.$transaction(async (tx) => {
      for (const reservation of reservationsToRelease) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          },
        });

        if (inventoryItem) {
          await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: {
              reservedQuantity: Math.max(0, inventoryItem.reservedQuantity - reservation.quantity),
            },
          });
        }

        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: { status: "RELEASED" },
        });
      }
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "StockReservation",
      entityId: orderId,
      newValues: { action: "bulk_release", count: reservationsToRelease.length },
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({
      success: true,
      message: `Released ${reservationsToRelease.length} reservations`,
      count: reservationsToRelease.length,
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
