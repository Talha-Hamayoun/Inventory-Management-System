import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

type RawLowStockRow = {
  id: number;
  available_quantity: number;
  minimum_stock_level: number;
  product_id: number;
  product_name: string;
  product_sku: string | null;
  warehouse_id: number;
  warehouse_name: string;
};

type RawMonthlyRow = {
  month: Date;
  revenue: string;
};

export async function getDashboardStatsController(c: Context) {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalProducts,
      totalCustomers,
      totalWarehouses,
      lowStockAlerts,
      pendingPurchaseOrders,
      salesOrderStatusCounts,
      revenueThisMonth,
      revenueLastMonth,
      monthlyRevenue,
      recentSalesOrders,
      lowStockItems,
    ] = await Promise.all([
      prisma.product.count({ where: { status: "ACTIVE", isDeleted: false } }),
      prisma.customer.count({ where: { isActive: true, isDeleted: false } }),
      prisma.warehouse.count({ where: { isActive: true, isDeleted: false } }),
      prisma.stockAlert.count({ where: { isActive: true } }),
      prisma.purchaseOrder.count({ where: { status: "ORDERED", isDeleted: false } }),

      prisma.salesOrder.groupBy({
        by: ["status"],
        where: { isDeleted: false },
        _count: true,
      }),

      prisma.salesOrder.aggregate({
        where: {
          status: "FULFILLED",
          isDeleted: false,
          createdAt: { gte: startOfThisMonth },
        },
        _sum: { totalAmount: true },
      }),

      prisma.salesOrder.aggregate({
        where: {
          status: "FULFILLED",
          isDeleted: false,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { totalAmount: true },
      }),

      // Monthly revenue for last 6 months
      prisma.$queryRaw<RawMonthlyRow[]>`
        SELECT
          DATE_TRUNC('month', "createdAt") AS month,
          COALESCE(SUM("totalAmount"), 0) AS revenue
        FROM "SalesOrder"
        WHERE
          "createdAt" >= NOW() - INTERVAL '6 months'
          AND "status" = 'FULFILLED'
          AND "isDeleted" = false
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      `,

      // Recent sales orders
      prisma.salesOrder.findMany({
        where: { isDeleted: false },
        include: {
          customer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Low stock items: availableQuantity <= minimumStockLevel
      prisma.$queryRaw<RawLowStockRow[]>`
        SELECT
          i.id,
          i."availableQuantity"   AS available_quantity,
          i."minimumStockLevel"   AS minimum_stock_level,
          i."productId"           AS product_id,
          p.name                  AS product_name,
          p.sku                   AS product_sku,
          i."warehouseId"         AS warehouse_id,
          w.name                  AS warehouse_name
        FROM "InventoryItem" i
        JOIN "Product"   p ON p.id = i."productId"
        JOIN "Warehouse" w ON w.id = i."warehouseId"
        WHERE i."availableQuantity" <= i."minimumStockLevel"
        ORDER BY i."availableQuantity" ASC
        LIMIT 5
      `,
    ]);

    // Build sales order status map
    const orderStatusMap: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      FULFILLED: 0,
      CANCELLED: 0,
    };
    for (const row of salesOrderStatusCounts) {
      orderStatusMap[row.status] = row._count;
    }

    // Build monthly revenue for last 6 months (fill gaps)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRevenueMap: Record<string, number> = {};
    for (const row of monthlyRevenue) {
      const d = new Date(row.month);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenueMap[key] = Number(row.revenue);
    }

    const monthlyRevenueData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return {
        month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        revenue: monthlyRevenueMap[key] ?? 0,
      };
    });

    const encodedRecentOrders = recentSalesOrders.map((o) => ({
      id: idParser.encode(o.id),
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt,
      customer: { id: idParser.encode(o.customer.id), name: o.customer.name },
    }));

    const encodedLowStockItems = lowStockItems.map((item) => ({
      id: idParser.encode(item.id),
      availableQuantity: item.available_quantity,
      minimumStockLevel: item.minimum_stock_level,
      product: {
        id: idParser.encode(item.product_id),
        name: item.product_name,
        sku: item.product_sku,
      },
      warehouse: {
        id: idParser.encode(item.warehouse_id),
        name: item.warehouse_name,
      },
    }));

    return c.json({
      success: true,
      data: {
        totalProducts,
        totalCustomers,
        totalWarehouses,
        lowStockAlerts,
        pendingPurchaseOrders,
        revenueThisMonth: Number(revenueThisMonth._sum.totalAmount ?? 0),
        revenueLastMonth: Number(revenueLastMonth._sum.totalAmount ?? 0),
        salesOrdersByStatus: orderStatusMap,
        monthlyRevenue: monthlyRevenueData,
        recentSalesOrders: encodedRecentOrders,
        lowStockItems: encodedLowStockItems,
      },
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
