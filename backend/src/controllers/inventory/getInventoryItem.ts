import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getInventoryItemController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);

    if (id === null) {
      return c.json({ success: false, message: "Invalid inventory item ID" }, 400);
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        product: true,
        warehouse: true,
      },
    });

    if (!item) {
      return c.json({ success: false, message: "Inventory item not found" }, 404);
    }

    const responseItem = {
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
    };

    return c.json({ success: true, data: responseItem });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
