import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getSalesOrderController(c: Context) {
  try {
    const id = idParser.decode(c.req.param("id"));
    if (id === null) return c.json({ success: false, message: "Invalid ID" }, 400);

    const order = await prisma.salesOrder.findFirst({
      where: { id, isDeleted: false },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true, address: true } },
        warehouse: { select: { id: true, name: true } },
        createdByUser: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (!order) return c.json({ success: false, message: "Sales order not found" }, 404);

    const encoded = {
      ...order,
      id: idParser.encode(order.id),
      customerId: idParser.encode(order.customerId),
      warehouseId: idParser.encode(order.warehouseId),
      createdBy: idParser.encode(order.createdBy),
      customer: { ...order.customer, id: idParser.encode(order.customer.id) },
      warehouse: { ...order.warehouse, id: idParser.encode(order.warehouse.id) },
      createdByUser: { ...order.createdByUser, id: idParser.encode(order.createdByUser.id) },
      items: order.items.map((item) => ({
        ...item,
        id: idParser.encode(item.id),
        salesOrderId: idParser.encode(item.salesOrderId),
        productId: idParser.encode(item.productId),
        product: { ...item.product, id: idParser.encode(item.product.id) },
      })),
    };

    return c.json({ success: true, data: encoded });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
