import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listProductsController(c: Context) {
  try {
    const { page, limit, search, categoryId, status } = (c.req as any).valid("query") as Validator["ProductQuery"];
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isDeleted: false };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) {
      const decodedCategoryId = idParser.decode(categoryId);
      if (decodedCategoryId === null) {
        return c.json({ success: false, message: "Invalid category ID" }, 400);
      }
      where.categoryId = decodedCategoryId;
    }
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { inventoryItems: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const encodedData = data.map(product => ({
      ...product,
      productNumber: `PROD-${String(product.id).padStart(6, "0")}`,
      id: idParser.encode(product.id),
      category: product.category ? {
        ...product.category,
        id: idParser.encode(product.category.id),
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
