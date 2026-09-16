import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listSalesOrdersController(c: Context) {
  try {
    const { page, limit, search, status, customerId } = (c.req as any).valid("query") as Validator["SalesOrderQuery"];
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isDeleted: false };

    if (status) where.status = status;

    if (customerId) {
      const id = idParser.decode(customerId);
      if (id !== null) where.customerId = id;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          warehouse: { select: { id: true, name: true } },
          items: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.salesOrder.count({ where }),
    ]);

    const encodedData = data.map((order) => ({
      ...order,
      id: idParser.encode(order.id),
      customerId: idParser.encode(order.customerId),
      warehouseId: idParser.encode(order.warehouseId),
      createdBy: idParser.encode(order.createdBy),
      customer: { ...order.customer, id: idParser.encode(order.customer.id) },
      warehouse: { ...order.warehouse, id: idParser.encode(order.warehouse.id) },
      itemCount: order.items.length,
      items: undefined,
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
