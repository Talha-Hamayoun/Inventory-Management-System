import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listPosProductsController(c: Context) {
  try {
    const { page, limit, search, categoryId, warehouseId } = (c.req as any).valid(
      "query"
    ) as Validator["PosProductQuery"];

    const decodedWarehouseId = idParser.decode(warehouseId);
    if (decodedWarehouseId === null) {
      return c.json({ success: false, message: "Invalid warehouse ID" }, 400);
    }

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {
      isDeleted: false,
      status: "ACTIVE",
    };

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      const decodedCategoryId = idParser.decode(categoryId);
      if (decodedCategoryId === null) {
        return c.json({ success: false, message: "Invalid category ID" }, 400);
      }
      where.categoryId = decodedCategoryId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          inventoryItems: {
            where: { warehouseId: decodedWarehouseId },
            select: { availableQuantity: true, reservedQuantity: true },
            take: 1,
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const data = products.map((product) => {
      const stock = product.inventoryItems[0]?.availableQuantity ?? 0;
      return {
        id: idParser.encode(product.id),
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
        status: product.status,
        availableQuantity: stock,
        category: product.category
          ? { id: idParser.encode(product.category.id), name: product.category.name }
          : null,
        outOfStock: stock <= 0,
      };
    });

    return c.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
