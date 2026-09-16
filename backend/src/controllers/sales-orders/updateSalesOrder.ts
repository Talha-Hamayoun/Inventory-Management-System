import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function updateSalesOrderController(c: Context) {
  try {
    const id = idParser.decode(c.req.param("id"));
    if (id === null) return c.json({ success: false, message: "Invalid ID" }, 400);

    const data = await c.req.json() as Validator["UpdateSalesOrder"];
    const user = getAuthUser(c)!;

    const existing = await prisma.salesOrder.findFirst({ where: { id, isDeleted: false } });
    if (!existing) return c.json({ success: false, message: "Sales order not found" }, 404);
    if (existing.status !== "PENDING") {
      return c.json({ success: false, message: "Only PENDING orders can be edited" }, 400);
    }

    const updateData: Record<string, unknown> = {};

    if (data.customerId) {
      const customerId = idParser.decode(data.customerId);
      if (customerId === null) return c.json({ success: false, message: "Invalid customer ID" }, 400);
      const customer = await prisma.customer.findFirst({ where: { id: customerId, isDeleted: false, isActive: true } });
      if (!customer) return c.json({ success: false, message: "Customer not found or inactive" }, 404);
      updateData.customerId = customerId;
    }

    if (data.warehouseId) {
      const warehouseId = idParser.decode(data.warehouseId);
      if (warehouseId === null) return c.json({ success: false, message: "Invalid warehouse ID" }, 400);
      const warehouse = await prisma.warehouse.findFirst({ where: { id: warehouseId, isDeleted: false, isActive: true } });
      if (!warehouse) return c.json({ success: false, message: "Warehouse not found or inactive" }, 404);
      updateData.warehouseId = warehouseId;
    }

    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.items) {
      const itemsWithCost: {
        productId: number;
        quantity: number;
        unitPrice: number;
        unitCost: number | null;
        totalPrice: number;
      }[] = [];

      for (const item of data.items) {
        const productId = idParser.decode(item.productId);
        if (productId === null) return c.json({ success: false, message: "Invalid product ID in items" }, 400);
        const product = await prisma.product.findFirst({ where: { id: productId, isDeleted: false } });
        if (!product) return c.json({ success: false, message: `Product ${item.productId} not found` }, 404);
        itemsWithCost.push({
          productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: product.costPrice != null ? Number(product.costPrice) : null,
          totalPrice: item.quantity * item.unitPrice,
        });
      }

      const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      updateData.totalAmount = totalAmount;
      updateData.items = {
        deleteMany: {},
        create: itemsWithCost,
      };
    }

    const order = await prisma.salesOrder.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        warehouse: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "SalesOrder",
      entityId: order.id,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const encoded = {
      ...order,
      id: idParser.encode(order.id),
      customerId: idParser.encode(order.customerId),
      warehouseId: idParser.encode(order.warehouseId),
      createdBy: idParser.encode(order.createdBy),
      customer: { ...order.customer, id: idParser.encode(order.customer.id) },
      warehouse: { ...order.warehouse, id: idParser.encode(order.warehouse.id) },
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
