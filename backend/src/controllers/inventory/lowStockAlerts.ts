import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function lowStockAlertsController(c: Context) {
  try {
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: { minimumStockLevel: { gt: 0 } },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    const filtered = lowStockItems.filter(
      (item) => item.availableQuantity <= item.minimumStockLevel
    );

    const encodedData = filtered.map((item) => ({
      ...item,
      id: idParser.encode(item.id),
      product: {
        ...item.product,
        id: idParser.encode(item.product.id),
      },
      warehouse: {
        ...item.warehouse,
        id: idParser.encode(item.warehouse.id),
      },
    }));

    return c.json({ success: true, data: encodedData });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
