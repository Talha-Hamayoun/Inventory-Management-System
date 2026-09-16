import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listReturnsController(c: Context) {
  try {
    const { page, limit, returnType, status, search, startDate, endDate } =
      (c.req as any).valid("query") as Validator["ReturnQuery"];
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (returnType) where.returnType = returnType;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
    }
    if (search) {
      where.returnNumber = { contains: search, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      prisma.returnOrder.findMany({
        where,
        include: {
          items: {
            include: { product: { select: { id: true, name: true, sku: true } } },
          },
          warehouse: { select: { id: true, name: true } },
          salesOrder: { select: { id: true, orderNumber: true } },
          purchaseOrder: { select: { id: true } },
          processedByUser: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.returnOrder.count({ where }),
    ]);

    const encodedData = data.map((r) => ({
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
        ? { ...r.salesOrder, id: idParser.encode(r.salesOrder.id) }
        : null,
      purchaseOrder: r.purchaseOrder
        ? {
            ...r.purchaseOrder,
            poNumber: `PO-${String(r.purchaseOrder.id).padStart(6, "0")}`,
            id: idParser.encode(r.purchaseOrder.id),
          }
        : null,
      processedByUser: { ...r.processedByUser, id: idParser.encode(r.processedByUser.id) },
      items: r.items.map((item) => ({
        ...item,
        id: idParser.encode(item.id),
        returnOrderId: idParser.encode(item.returnOrderId),
        productId: idParser.encode(item.productId),
        product: { ...item.product, id: idParser.encode(item.product.id) },
      })),
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
