import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function createPurchaseOrderController(c: Context) {
  try {
    const data = await c.req.json() as Validator["CreatePurchaseOrder"];
    const user = getAuthUser(c)!;

    const supplierId = idParser.decode(data.supplierId);
    const warehouseId = idParser.decode(data.warehouseId);

    if (supplierId === null) {
      return c.json({ success: false, message: "Invalid supplier ID" }, 400);
    }
    if (warehouseId === null) {
      return c.json({ success: false, message: "Invalid warehouse ID" }, 400);
    }

    const [supplier, warehouse] = await Promise.all([
      prisma.supplier.findFirst({ where: { id: supplierId, isDeleted: false, isActive: true } }),
      prisma.warehouse.findFirst({ where: { id: warehouseId, isDeleted: false, isActive: true } }),
    ]);

    if (!supplier) {
      return c.json({ success: false, message: "Supplier not found or inactive" }, 404);
    }
    if (!warehouse) {
      return c.json({ success: false, message: "Warehouse not found or inactive" }, 404);
    }

    for (const item of data.items) {
      const productId = idParser.decode(item.productId);
      if (productId === null) {
        return c.json({ success: false, message: `Invalid product ID in items` }, 400);
      }
      const product = await prisma.product.findFirst({
        where: { id: productId, isDeleted: false },
      });
      if (!product) {
        return c.json({ success: false, message: `Product ${item.productId} not found` }, 404);
      }
    }

    const totalCost = data.items.reduce(
      (sum: number, item: { orderedQuantity: number; unitCost: number }) => sum + item.orderedQuantity * item.unitCost,
      0
    );
    const items = data.items.map((item) => ({
      productId: idParser.decode(item.productId) as number,
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: 0,
      unitCost: item.unitCost,
    })).filter(item => item.productId !== null)

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        supplierId: supplierId,
        warehouseId: warehouseId,
        status: data.status ?? "DRAFT",
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
        totalCost,
        createdBy: user.id,
        items: {
          create: items,
        },
      },
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

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entityType: "PurchaseOrder",
      entityId: purchaseOrder.id,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const formattedPurchaseOrder = {
      ...purchaseOrder,
      id: idParser.encode(purchaseOrder.id),
      supplierId: idParser.encode(purchaseOrder.supplierId),
      warehouseId: idParser.encode(purchaseOrder.warehouseId),
      createdBy: idParser.encode(purchaseOrder.createdBy),
      supplier: purchaseOrder.supplier && {
        ...purchaseOrder.supplier,
        id: idParser.encode(purchaseOrder.supplier.id)
      },
      warehouse: purchaseOrder.warehouse && {
        ...purchaseOrder.warehouse,
        id: idParser.encode(purchaseOrder.warehouse.id)
      },
      items: purchaseOrder.items.map((item) => ({
        ...item,
        id: idParser.encode(item.id),
        productId: idParser.encode(item.productId),
        purchaseOrderId: idParser.encode(item.purchaseOrderId),
        product: item.product && {
          ...item.product,
          id: idParser.encode(item.product.id),
        },
      })),
    }

    return c.json({ success: true, data: formattedPurchaseOrder }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
