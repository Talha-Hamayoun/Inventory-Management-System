import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listPurchaseOrdersController(c: Context) {
  try {
    const { page, limit, search, supplierId, warehouseId, status } = (c.req as any).valid("query") as Validator["PoQuery"];
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isDeleted: false };
    if (supplierId) {
      const decodedSupplierId = idParser.decode(supplierId);
      if (decodedSupplierId === null) {
        return c.json({ success: false, message: "Invalid supplier ID" }, 400);
      }
      where.supplierId = decodedSupplierId;
    }
    if (warehouseId) {
      const decodedWarehouseId = idParser.decode(warehouseId);
      if (decodedWarehouseId === null) {
        return c.json({ success: false, message: "Invalid warehouse ID" }, 400);
      }
      where.warehouseId = decodedWarehouseId;
    }
    if (status) where.status = status;
    if (search) {
      where.supplier = { name: { contains: search, mode: "insensitive" } };
    }

    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          createdByUser: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    const encodedData = data.map(po => ({
      ...po,
      poNumber: `PO-${String(po.id).padStart(6, "0")}`,
      id: idParser.encode(po.id),
      warehouseId: po.warehouseId ? idParser.encode(po.warehouseId) : null,
      supplierId: po.supplierId ? idParser.encode(po.supplierId) : null,
      createdBy: po.createdBy ? idParser.encode(po.createdBy) : null,
      supplier: po.supplier ? {
        ...po.supplier,
        id: idParser.encode(po.supplier.id),
      } : null,
      warehouse: po.warehouse ? {
        ...po.warehouse,
        id: idParser.encode(po.warehouse.id),
      } : null,
      createdByUser: po.createdByUser ? {
        ...po.createdByUser,
        id: idParser.encode(po.createdByUser.id),
      } : null,
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
