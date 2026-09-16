import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function createReturnController(c: Context) {
  try {
    const data = await c.req.json() as Validator["CreateReturn"];
    const user = getAuthUser(c)!;

    const warehouseId = idParser.decode(data.warehouseId);
    if (warehouseId === null) return c.json({ success: false, message: "Invalid warehouse ID" }, 400);

    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, isDeleted: false, isActive: true },
    });
    if (!warehouse) return c.json({ success: false, message: "Warehouse not found or inactive" }, 404);

    let salesOrderId: number | null = null;
    let purchaseOrderId: number | null = null;
    let customerId: number | null = null;
    let supplierId: number | null = null;

    if (data.returnType === "SALES_RETURN") {
      if (!data.salesOrderId) {
        return c.json({ success: false, message: "salesOrderId is required for SALES_RETURN" }, 400);
      }
      salesOrderId = idParser.decode(data.salesOrderId);
      if (salesOrderId === null) return c.json({ success: false, message: "Invalid sales order ID" }, 400);

      const salesOrder = await prisma.salesOrder.findFirst({
        where: { id: salesOrderId, isDeleted: false },
        include: { items: true },
      });
      if (!salesOrder) return c.json({ success: false, message: "Sales order not found" }, 404);
      if (salesOrder.status !== "FULFILLED") {
        return c.json({ success: false, message: "Can only return items from FULFILLED sales orders" }, 400);
      }
      customerId = salesOrder.customerId;

      const itemsWithPrices = [];
      for (const item of data.items) {
        const productId = idParser.decode(item.productId);
        if (productId === null) return c.json({ success: false, message: "Invalid product ID in items" }, 400);

        const product = await prisma.product.findFirst({ where: { id: productId, isDeleted: false } });
        if (!product) return c.json({ success: false, message: `Product ${item.productId} not found` }, 404);

        const soItem = salesOrder.items.find((i) => i.productId === productId);
        if (!soItem) {
          return c.json({
            success: false,
            message: `Product "${product.name}" was not part of this sales order`,
          }, 400);
        }

        itemsWithPrices.push({
          productId,
          quantity: item.quantity,
          condition: item.condition,
          unitPrice: Number(soItem.unitPrice),
          unitCost: soItem.unitCost != null ? Number(soItem.unitCost) : null,
        });
      }

      const created = await prisma.returnOrder.create({
        data: {
          returnNumber: `RET-TEMP-${Date.now()}`,
          returnType: "SALES_RETURN",
          status: "PENDING",
          salesOrderId,
          customerId,
          warehouseId,
          notes: data.notes,
          processedBy: user.id,
          items: { create: itemsWithPrices },
        },
      });
      const returnOrder = await prisma.returnOrder.update({
        where: { id: created.id },
        data: { returnNumber: `RET-SO-${String(created.id).padStart(6, "0")}` },
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          warehouse: { select: { id: true, name: true } },
          salesOrder: { select: { id: true, orderNumber: true } },
          processedByUser: { select: { id: true, name: true } },
        },
      });

      await createAuditLog({
        userId: user.id,
        action: "CREATE",
        entityType: "ReturnOrder",
        entityId: returnOrder.id,
        newValues: data,
        ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
        userAgent: c.req.header("user-agent"),
      });

      return c.json({ success: true, data: encodeReturnOrder(returnOrder) }, 201);
    }

    // PURCHASE_RETURN
    if (!data.purchaseOrderId) {
      return c.json({ success: false, message: "purchaseOrderId is required for PURCHASE_RETURN" }, 400);
    }
    purchaseOrderId = idParser.decode(data.purchaseOrderId);
    if (purchaseOrderId === null) return c.json({ success: false, message: "Invalid purchase order ID" }, 400);

    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, isDeleted: false },
      include: { items: true },
    });
    if (!purchaseOrder) return c.json({ success: false, message: "Purchase order not found" }, 404);
    if (purchaseOrder.status !== "COMPLETED" && purchaseOrder.status !== "PARTIALLY_RECEIVED") {
      return c.json({ success: false, message: "Can only return items from received purchase orders" }, 400);
    }
    supplierId = purchaseOrder.supplierId;

    const itemsWithPrices = [];
    for (const item of data.items) {
      const productId = idParser.decode(item.productId);
      if (productId === null) return c.json({ success: false, message: "Invalid product ID in items" }, 400);

      const product = await prisma.product.findFirst({ where: { id: productId, isDeleted: false } });
      if (!product) return c.json({ success: false, message: `Product ${item.productId} not found` }, 404);

      const poItem = purchaseOrder.items.find((i) => i.productId === productId);
      if (!poItem) {
        return c.json({
          success: false,
          message: `Product "${product.name}" was not part of this purchase order`,
        }, 400);
      }

      itemsWithPrices.push({
        productId,
        quantity: item.quantity,
        condition: item.condition,
        unitPrice: Number(poItem.unitCost),
        unitCost: Number(poItem.unitCost),
      });
    }

    const created = await prisma.returnOrder.create({
      data: {
        returnNumber: `RET-TEMP-${Date.now()}`,
        returnType: "PURCHASE_RETURN",
        status: "PENDING",
        purchaseOrderId,
        supplierId,
        warehouseId,
        notes: data.notes,
        processedBy: user.id,
        items: { create: itemsWithPrices },
      },
    });
    const returnOrder = await prisma.returnOrder.update({
      where: { id: created.id },
      data: { returnNumber: `RET-PO-${String(created.id).padStart(6, "0")}` },
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        warehouse: { select: { id: true, name: true } },
        purchaseOrder: { select: { id: true } },
        supplier: { select: { id: true, name: true } },
        processedByUser: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entityType: "ReturnOrder",
      entityId: returnOrder.id,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({ success: true, data: encodeReturnOrder(returnOrder) }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}

export function encodeReturnOrder(r: any) {
  return {
    ...r,
    id: idParser.encode(r.id),
    warehouseId: idParser.encode(r.warehouseId),
    salesOrderId: r.salesOrderId ? idParser.encode(r.salesOrderId) : null,
    customerId: r.customerId ? idParser.encode(r.customerId) : null,
    purchaseOrderId: r.purchaseOrderId ? idParser.encode(r.purchaseOrderId) : null,
    supplierId: r.supplierId ? idParser.encode(r.supplierId) : null,
    processedBy: idParser.encode(r.processedBy),
    warehouse: r.warehouse ? { ...r.warehouse, id: idParser.encode(r.warehouse.id) } : null,
    salesOrder: r.salesOrder ? { ...r.salesOrder, id: idParser.encode(r.salesOrder.id) } : null,
    purchaseOrder: r.purchaseOrder ? { ...r.purchaseOrder, id: idParser.encode(r.purchaseOrder.id) } : null,
    supplier: r.supplier ? { ...r.supplier, id: idParser.encode(r.supplier.id) } : null,
    processedByUser: r.processedByUser
      ? { ...r.processedByUser, id: idParser.encode(r.processedByUser.id) }
      : null,
    items: (r.items || []).map((item: any) => ({
      ...item,
      id: idParser.encode(item.id),
      returnOrderId: idParser.encode(item.returnOrderId),
      productId: idParser.encode(item.productId),
      product: item.product ? { ...item.product, id: idParser.encode(item.product.id) } : null,
    })),
  };
}
