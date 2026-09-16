import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listReservationsController(c: Context) {
  try {
    const { page, limit, orderId, status, warehouseId } = (c.req as any).valid("query") as Validator["ReservationQuery"];
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (orderId) {
      const decodedOrderId = idParser.decode(orderId);
      if (decodedOrderId === null) {
        return c.json({ success: false, message: "Invalid order ID" }, 400);
      }
      where.orderId = decodedOrderId;
    }
    if (status) where.status = status;
    if (warehouseId) {
      const decodedWarehouseId = idParser.decode(warehouseId);
      if (decodedWarehouseId === null) {
        return c.json({ success: false, message: "Invalid warehouse ID" }, 400);
      }
      where.warehouseId = decodedWarehouseId;
    }

    const [data, total] = await Promise.all([
      prisma.stockReservation.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.stockReservation.count({ where }),
    ]);

    const encodedData = data.map(reservation => ({
      ...reservation,
      reservationNumber: `RES-${String(reservation.id).padStart(6, "0")}`,
      id: idParser.encode(reservation.id),
      product: {
        ...reservation.product,
        id: idParser.encode(reservation.product.id),
      },
      warehouse: {
        ...reservation.warehouse,
        id: idParser.encode(reservation.warehouse.id),
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
