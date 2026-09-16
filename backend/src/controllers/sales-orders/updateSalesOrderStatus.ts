import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function updateSalesOrderStatusController(c: Context) {
  try {
    const id = idParser.decode(c.req.param("id"));
    if (id === null) return c.json({ success: false, message: "Invalid ID" }, 400);

    const { status } = await c.req.json() as Validator["UpdateSalesOrderStatus"];
    const user = getAuthUser(c)!;

    const order = await prisma.salesOrder.findFirst({
      where: { id, isDeleted: false },
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    });

    if (!order) return c.json({ success: false, message: "Sales order not found" }, 404);

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["FULFILLED", "CANCELLED"],
      FULFILLED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      return c.json({
        success: false,
        message: `Cannot transition from ${order.status} to ${status}`,
      }, 400);
    }

    // On FULFILLED: deduct stock from inventory
    if (status === "FULFILLED") {
      for (const item of order.items) {
        const inventoryItem = await prisma.inventoryItem.findUnique({
          where: { productId_warehouseId: { productId: item.productId, warehouseId: order.warehouseId } },
        });

        if (!inventoryItem) {
          return c.json({
            success: false,
            message: `No inventory found for product "${item.product.name}" in this warehouse`,
          }, 400);
        }

        if (inventoryItem.availableQuantity < item.quantity) {
          return c.json({
            success: false,
            message: `Insufficient stock for "${item.product.name}". Available: ${inventoryItem.availableQuantity}, Required: ${item.quantity}`,
          }, 400);
        }
      }

      // All checks passed — deduct stock and create movements
      for (const item of order.items) {
        await prisma.inventoryItem.update({
          where: { productId_warehouseId: { productId: item.productId, warehouseId: order.warehouseId } },
          data: { availableQuantity: { decrement: item.quantity } },
        });

        await prisma.inventoryMovement.create({
          data: {
            productId: item.productId,
            warehouseId: order.warehouseId,
            type: "OUT",
            quantity: item.quantity,
            referenceType: "ORDER",
            referenceId: order.id,
            performedBy: user.id,
            notes: `Fulfilled by sales order ${order.orderNumber}`,
          },
        });
      }

      await prisma.salesOrder.update({ where: { id }, data: { status } });
    } else {
      await prisma.salesOrder.update({ where: { id }, data: { status } });
    }

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "SalesOrder",
      entityId: id,
      newValues: { status },
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
