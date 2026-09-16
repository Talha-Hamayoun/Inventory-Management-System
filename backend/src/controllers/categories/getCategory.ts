import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getCategoryController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);

    if (id === null) {
      return c.json({ success: false, message: "Invalid category ID" }, 400);
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return c.json({ success: false, message: "Category not found" }, 404);
    }

    const responseCategory = {
      ...category,
      id: idParser.encode(category.id),
      parent: category.parent ? {
        ...category.parent,
        id: idParser.encode(category.parent.id),
      } : null,
      children: category.children.map(child => ({
        ...child,
        id: idParser.encode(child.id),
      })),
    };

    return c.json({ success: true, data: responseCategory });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
