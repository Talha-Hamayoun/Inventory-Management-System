import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getReturnController(c: Context) {
  try {
    const id = idParser.decode(c.req.param("id"));
    if (id === null) return c.json({ success: false, message: "Invalid return ID" }, 400);

    const r = await prisma.returnOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
        warehouse: { select: { id: true, name: true } },
        salesOrder: { select: { id: true, orderNumber: true, customerId: true } },
        purchaseOrder: { select: { id: true } },
        supplier: { select: { id: true, name: true } },
        processedByUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (!r) return c.json({ success: false, message: "Return not found" }, 404);

    const encoded = {
      ...r,
      id: idParser.encode(r.id),
      warehouseId: idParser.encode(r.warehouseId),
      salesOrderId: r.salesOrderId ? idParser.encode(r.salesOrderId) : null,
      customerId: r.customerId ? idParser.encode(r.customerId) : null,
      purchaseOrderId: r.purchaseOrderId ? idParser.encode(r.purchaseOrderId) : null,
      supplierId: r.supplierId ? idParser.encode(r.supplierId) : null,
      processedBy: idParser.encode(r.processedBy),
      warehouse: { ...r.warehouse, id: idParser.encode(r.warehouse.id) },
      salesOrder: r.salesOrder
        ? { ...r.salesOrder, id: idParser.encode(r.salesOrder.id), customerId: idParser.encode(r.salesOrder.customerId) }
        : null,
      purchaseOrder: r.purchaseOrder
        ? { ...r.purchaseOrder, id: idParser.encode(r.purchaseOrder.id) }
        : null,
      supplier: r.supplier
        ? { ...r.supplier, id: idParser.encode(r.supplier.id) }
        : null,
      processedByUser: { ...r.processedByUser, id: idParser.encode(r.processedByUser.id) },
      items: r.items.map((item) => ({
        ...item,
        id: idParser.encode(item.id),
        returnOrderId: idParser.encode(item.returnOrderId),
        productId: idParser.encode(item.productId),
        product: { ...item.product, id: idParser.encode(item.product.id) },
      })),
    };

    return c.json({ success: true, data: encoded });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
