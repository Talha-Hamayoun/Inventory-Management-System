import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listWarehousesController(c: Context) {
  try {
    const { page, limit, search } = (c.req as any).valid("query") as Validator["Pagination"];
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isDeleted: false };
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        include: {
          _count: { select: { inventoryItems: true, purchaseOrders: true } },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.warehouse.count({ where }),
    ]);

    const encodedData = data.map(warehouse => ({
      ...warehouse,
      id: idParser.encode(warehouse.id),
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
