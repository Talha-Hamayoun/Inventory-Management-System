import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getPurchaseOrderController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);

    if (id === null) {
      return c.json({ success: false, message: "Invalid purchase order ID" }, 400);
    }

    const po = await prisma.purchaseOrder.findFirst({
      where: { id, isDeleted: false },
      include: {
        supplier: true,
        warehouse: true,
        createdByUser: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (!po) {
      return c.json({ success: false, message: "Purchase order not found" }, 404);
    }

    const responsePO = {
      ...po,
      id: idParser.encode(po.id),
      supplier: po.supplier ? {
        ...po.supplier,
        id: idParser.encode(po.supplier.id),
      } : null,
      warehouse: po.warehouse ? {
        ...po.warehouse,
        id: idParser.encode(po.warehouse.id),
      } : null,
      createdByUser: po.createdByUser ? {
        ...po.createdByUser,
        id: idParser.encode(po.createdByUser.id),
      } : null,
      items: po.items.map(item => ({
        ...item,
        id: idParser.encode(item.id),
        purchaseOrderId: idParser.encode(item.purchaseOrderId),
        productId: idParser.encode(item.productId),
        product: item.product ? {
          ...item.product,
          id: idParser.encode(item.product.id),
        } : null,
      })),
    };

    return c.json({ success: true, data: responsePO });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
