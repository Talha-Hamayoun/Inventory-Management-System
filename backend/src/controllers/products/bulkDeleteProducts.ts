import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function bulkDeleteProductsController(c: Context) {
  try {
    const body = await c.req.json<{ ids?: string[] }>();
    const hashedIds = Array.isArray(body.ids) ? body.ids : [];

    if (hashedIds.length === 0) {
      return c.json(
        { success: false, message: "Select at least one product" },
        400,
      );
    }

    const ids = hashedIds.map((hashedId) => idParser.decode(hashedId));
    if (ids.some((id) => id === null)) {
      return c.json(
        { success: false, message: "One or more product IDs are invalid" },
        400,
      );
    }

    const productIds = ids as number[];
    const user = getAuthUser(c)!;
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isDeleted: false },
    });

    if (products.length !== productIds.length) {
      return c.json(
        { success: false, message: "One or more products were not found" },
        404,
      );
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.product.updateMany({
        where: { id: { in: productIds }, isDeleted: false },
        data: { isDeleted: true, status: "ARCHIVED" },
      });

      for (const product of products) {
        await createAuditLog({
          userId: user.id,
          action: "DELETE",
          entityType: "Product",
          entityId: product.id,
          oldValues: product as unknown as Record<string, unknown>,
          ipAddress:
            c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
          userAgent: c.req.header("user-agent"),
          transaction,
        });
      }
    });

    return c.json({
      success: true,
      message: `${products.length} product${products.length === 1 ? "" : "s"} deleted successfully`,
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
