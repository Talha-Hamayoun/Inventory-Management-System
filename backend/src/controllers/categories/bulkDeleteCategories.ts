import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function bulkDeleteCategoriesController(c: Context) {
  try {
    const body = await c.req.json<{ ids?: string[] }>();
    const hashedIds = Array.isArray(body.ids) ? body.ids : [];

    if (hashedIds.length === 0) {
      return c.json(
        { success: false, message: "Select at least one category" },
        400,
      );
    }

    const ids = hashedIds.map((hashedId) => idParser.decode(hashedId));
    if (ids.some((id) => id === null)) {
      return c.json(
        { success: false, message: "One or more category IDs are invalid" },
        400,
      );
    }

    const categoryIds = [...new Set(ids as number[])];
    if (categoryIds.length !== hashedIds.length) {
      return c.json(
        { success: false, message: "Duplicate category IDs are not allowed" },
        400,
      );
    }

    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      include: { _count: { select: { products: true, children: true } } },
    });

    if (categories.length !== categoryIds.length) {
      return c.json(
        { success: false, message: "One or more categories were not found" },
        404,
      );
    }

    const blockedCategory = categories.find(
      (category) =>
        category._count.products > 0 || category._count.children > 0,
    );
    if (blockedCategory) {
      const reason =
        blockedCategory._count.products > 0 ? "products" : "subcategories";
      return c.json(
        {
          success: false,
          message: `Cannot delete category ${blockedCategory.name} with ${reason}`,
        },
        400,
      );
    }

    const user = getAuthUser(c)!;
    await prisma.$transaction(async (transaction) => {
      await transaction.category.deleteMany({
        where: { id: { in: categoryIds } },
      });

      for (const category of categories) {
        await createAuditLog({
          userId: user.id,
          action: "DELETE",
          entityType: "Category",
          entityId: category.id,
          oldValues: category as unknown as Record<string, unknown>,
          ipAddress:
            c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
          userAgent: c.req.header("user-agent"),
          transaction,
        });
      }
    });

    return c.json({
      success: true,
      message: `${categories.length} categor${categories.length === 1 ? "y" : "ies"} deleted successfully`,
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
