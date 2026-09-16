import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function deleteCategoryController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid category ID" }, 400);
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });

    if (!existing) {
      return c.json({ success: false, message: "Category not found" }, 404);
    }

    if (existing._count.products > 0) {
      return c.json({ success: false, message: "Cannot delete category with products" }, 400);
    }

    if (existing._count.children > 0) {
      return c.json({ success: false, message: "Cannot delete category with subcategories" }, 400);
    }

    await prisma.category.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entityType: "Category",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
