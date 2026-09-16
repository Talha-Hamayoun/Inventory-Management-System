import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";
import { encodeReturnOrder } from "./createReturn";

export async function processReturnController(c: Context) {
  try {
    const id = idParser.decode(c.req.param("id"));
    if (id === null) return c.json({ success: false, message: "Invalid return ID" }, 400);
    const user = getAuthUser(c)!;

    const returnOrder = await prisma.returnOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!returnOrder) return c.json({ success: false, message: "Return not found" }, 404);
    if (returnOrder.status !== "PENDING") {
      return c.json({ success: false, message: "Only PENDING returns can be processed" }, 400);
    }

    for (const item of returnOrder.items) {
      let inventoryItem = await prisma.inventoryItem.findUnique({
        where: { productId_warehouseId: { productId: item.productId, warehouseId: returnOrder.warehouseId } },
      });

      if (!inventoryItem) {
        inventoryItem = await prisma.inventoryItem.create({
          data: {
            productId: item.productId,
            warehouseId: returnOrder.warehouseId,
            availableQuantity: 0,
            reservedQuantity: 0,
            damagedQuantity: 0,
            minimumStockLevel: 0,
          },
        });
      }

      if (returnOrder.returnType === "SALES_RETURN") {
        // Stock comes back to us
        if (item.condition === "RESTOCKABLE") {
          await prisma.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: { availableQuantity: inventoryItem.availableQuantity + item.quantity },
          });
        } else {
          await prisma.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: { damagedQuantity: inventoryItem.damagedQuantity + item.quantity },
          });
        }
      } else {
        // PURCHASE_RETURN: stock leaves to supplier — validate sufficient stock first
        if (inventoryItem.availableQuantity < item.quantity) {
          return c.json({
            success: false,
            message: `Insufficient stock for product ID ${item.productId}. Available: ${inventoryItem.availableQuantity}, trying to return: ${item.quantity}`,
          }, 400);
        }
        await prisma.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { availableQuantity: inventoryItem.availableQuantity - item.quantity },
        });
      }

      await prisma.inventoryMovement.create({
        data: {
          productId: item.productId,
          warehouseId: returnOrder.warehouseId,
          type: "RETURN",
          quantity: item.quantity,
          referenceType: "RETURN",
          referenceId: returnOrder.id,
          performedBy: user.id,
          notes: `${returnOrder.returnType} processed. Condition: ${item.condition}.`,
        },
      });
    }

    const updated = await prisma.returnOrder.update({
      where: { id },
      data: { status: "PROCESSED" },
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        warehouse: { select: { id: true, name: true } },
        salesOrder: { select: { id: true, orderNumber: true } },
        purchaseOrder: { select: { id: true } },
        supplier: { select: { id: true, name: true } },
        processedByUser: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "ReturnOrder",
      entityId: id,
      newValues: { status: "PROCESSED" },
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({ success: true, data: encodeReturnOrder(updated) });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
