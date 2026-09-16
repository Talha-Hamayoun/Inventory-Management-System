import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listCategoriesController(c: Context) {
  try {
    const { page, limit, search } = (c.req as any).valid("query") as Validator["Pagination"];
    const skip = (page - 1) * limit;

    const where = search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {};

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          parent: { select: { id: true, name: true } },
          _count: { select: { products: true, children: true } },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.category.count({ where }),
    ]);

    const encodedData = data.map(category => ({
      ...category,
      id: idParser.encode(category.id),
      parent: category.parent ? {
        ...category.parent,
        id: idParser.encode(category.parent.id),
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
