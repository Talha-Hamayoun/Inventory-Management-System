import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function receivePurchaseOrderController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const { items } = await c.req.json() as Validator["ReceivePurchaseOrder"];
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid purchase order ID" }, 400);
    }

    const po = await prisma.purchaseOrder.findFirst({
      where: { id, isDeleted: false },
      include: { items: true },
    });

    if (!po) {
      return c.json({ success: false, message: "Purchase order not found" }, 404);
    }

    if (po.status === "COMPLETED" || po.status === "CANCELLED") {
      return c.json({ success: false, message: "Cannot receive items for completed or cancelled order" }, 400);
    }

    await prisma.$transaction(async (tx) => {
      for (const receiveItem of items) {
        const poItem = po.items.find((i) => i.id === idParser.decode(receiveItem.itemId));
        if (!poItem) {
          throw new Error(`Item ${receiveItem.itemId} not found in purchase order`);
        }

        const newReceivedQty = poItem.receivedQuantity + receiveItem.receivedQuantity;
        if (newReceivedQty > poItem.orderedQuantity) {
          throw new Error(`Cannot receive more than ordered quantity for item ${poItem.id}`);
        }

        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { receivedQuantity: newReceivedQty },
        });

        const existingInventory = await tx.inventoryItem.findUnique({
          where: {
            productId_warehouseId: {
              productId: poItem.productId,
              warehouseId: po.warehouseId,
            },
          },
        });

        if (existingInventory) {
          await tx.inventoryItem.update({
            where: { id: existingInventory.id },
            data: {
              availableQuantity: existingInventory.availableQuantity + receiveItem.receivedQuantity,
            },
          });
        } else {
          await tx.inventoryItem.create({
            data: {
              productId: poItem.productId,
              warehouseId: po.warehouseId,
              availableQuantity: receiveItem.receivedQuantity,
            },
          });
        }

        await tx.inventoryMovement.create({
          data: {
            productId: poItem.productId,
            warehouseId: po.warehouseId,
            type: "IN",
            quantity: receiveItem.receivedQuantity,
            referenceType: "PO",
            referenceId: po.id,
            performedBy: user.id,
            notes: `Received from PO ${po.id}`,
          },
        });
      }

      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
      });

      const allReceived = updatedItems.every((i) => i.receivedQuantity >= i.orderedQuantity);
      const someReceived = updatedItems.some((i) => i.receivedQuantity > 0);

      let newStatus = po.status;
      if (allReceived) {
        newStatus = "COMPLETED";
      } else if (someReceived) {
        newStatus = "PARTIALLY_RECEIVED";
      }

      if (newStatus !== po.status) {
        await tx.purchaseOrder.update({
          where: { id },
          data: { status: newStatus },
        });
      }
    });

    const updatedPO = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (!updatedPO)
      return c.json({ success: false, message: "Failed to retrieve updated purchase order" }, 500);



    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "PurchaseOrder",
      entityId: id,
      oldValues: { status: po.status },
      newValues: { status: updatedPO?.status, receivedItems: items },
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const finalResponsePO: a = {
      ...updatedPO,
      id: idParser.encode(updatedPO.id),
      totalCost: updatedPO.totalCost.toNumber(),
      supplier: {
        id: idParser.encode(updatedPO.supplier.id),
        name: updatedPO.supplier.name,
      },
      warehouse: {
        id: idParser.encode(updatedPO.warehouse.id),
        name: updatedPO.warehouse.name,
      },
      items: updatedPO.items.map((item) => ({
        id: idParser.encode(item.id),
        purchaseOrderId: idParser.encode(item.purchaseOrderId),
        orderedQuantity: item.orderedQuantity,
        receivedQuantity: item.receivedQuantity,
        unitCost: item.unitCost.toNumber(),
        product: {
          id: idParser.encode(item.product.id),
          name: item.product.name,
          sku: item.product.sku,
        }
      }))
    }
    return c.json({ success: true, data: finalResponsePO });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}


type a = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  supplierId: number;
  warehouseId: number;
  status: "DRAFT" | "ORDERED" | "PARTIALLY_RECEIVED" | "COMPLETED" | "CANCELLED";
  expectedDeliveryDate: Date | null;
  totalCost: number;
  createdBy: number;
  isDeleted: boolean;
  supplier: {
    id: string;
    name: string;
  }
  warehouse: {
    id: string;
    name: string;
  }
  items: {
    id: string;
    purchaseOrderId: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unitCost: number;
    product: {
      id: string;
      name: string;
      sku: string | null;
    };
  }[]

}