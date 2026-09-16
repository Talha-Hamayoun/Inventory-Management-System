import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getProductController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);

    if (id === null) {
      return c.json({ success: false, message: "Invalid product ID" }, 400);
    }

    const product = await prisma.product.findFirst({
      where: { id, isDeleted: false },
      include: {
        category: { select: { id: true, name: true } },
        inventoryItems: {
          include: {
            warehouse: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!product) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }

    const responseProduct = {
      ...product,
      id: idParser.encode(product.id),
      categoryId: product.categoryId ? idParser.encode(product.categoryId) : null,
      category: product.category ? {
        ...product.category,
        id: idParser.encode(product.category.id),
      } : null,
      inventoryItems: product.inventoryItems.map(item => ({
        ...item,
        id: idParser.encode(item.id),
        warehouse: {
          ...item.warehouse,
          id: idParser.encode(item.warehouse.id),
        },
      })),
    };

    return c.json({ success: true, product: responseProduct });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
