import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getWarehouseController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    if (id === null) {
      return c.json({ success: false, message: "Invalid warehouse ID" }, 400);
    }

    const warehouse = await prisma.warehouse.findFirst({
      where: { id, isDeleted: false },
      include: {
        _count: { select: { inventoryItems: true, purchaseOrders: true } },
      },
    });
    if (!warehouse) {
      return c.json({ success: false, message: "Warehouse not found" }, 404);
    }

    const inventorySummary = await prisma.inventoryItem.aggregate({
      where: { warehouseId: id },
      _sum: {
        availableQuantity: true,
        reservedQuantity: true,
        damagedQuantity: true,
      },
    });

    const responseWarehouse = {
      ...warehouse,
      id: idParser.encode(warehouse.id),
      inventorySummary: {
        totalAvailable: inventorySummary._sum.availableQuantity || 0,
        totalReserved: inventorySummary._sum.reservedQuantity || 0,
        totalDamaged: inventorySummary._sum.damagedQuantity || 0,
      },
    };
    return c.json({ success: true, data: responseWarehouse });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
