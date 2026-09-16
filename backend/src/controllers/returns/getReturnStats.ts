import { Context } from "hono";
import { prisma } from "../../lib/prisma";

export async function getReturnStatsController(c: Context) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, salesReturns, purchaseReturns, pending, processed, cancelled, recent] =
      await Promise.all([
        prisma.returnOrder.count(),
        prisma.returnOrder.count({ where: { returnType: "SALES_RETURN" } }),
        prisma.returnOrder.count({ where: { returnType: "PURCHASE_RETURN" } }),
        prisma.returnOrder.count({ where: { status: "PENDING" } }),
        prisma.returnOrder.count({ where: { status: "PROCESSED" } }),
        prisma.returnOrder.count({ where: { status: "CANCELLED" } }),
        prisma.returnOrder.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      ]);

    return c.json({
      success: true,
      data: {
        total,
        recent,
        byType: { salesReturn: salesReturns, purchaseReturn: purchaseReturns },
        byStatus: { pending, processed, cancelled },
      },
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
