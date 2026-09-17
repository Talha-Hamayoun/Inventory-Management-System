import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";
import { resolveDiscount } from "../../lib/salesOrderDiscount";

export async function createSalesOrderController(c: Context) {
  try {
    const data = (c.req as any).valid("json") as Validator["CreateSalesOrder"];
    const user = getAuthUser(c)!;

    const customerId = idParser.decode(data.customerId);
    const warehouseId = idParser.decode(data.warehouseId);

    if (customerId === null) return c.json({ success: false, message: "Invalid customer ID" }, 400);
    if (warehouseId === null) return c.json({ success: false, message: "Invalid warehouse ID" }, 400);

    const [customer, warehouse] = await Promise.all([
      prisma.customer.findFirst({ where: { id: customerId, isDeleted: false, isActive: true } }),
      prisma.warehouse.findFirst({ where: { id: warehouseId, isDeleted: false, isActive: true } }),
    ]);

    if (!customer) return c.json({ success: false, message: "Customer not found or inactive" }, 404);
    if (!warehouse) return c.json({ success: false, message: "Warehouse not found or inactive" }, 404);

    // Validate items and build insert list with cost price snapshot for P&L tracking
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

      // Validate unit price >= cost price
      if (product.costPrice !== null && product.costPrice !== undefined) {
        if (item.unitPrice < Number(product.costPrice)) {
          return c.json({
            success: false,
            message: `Unit price for "${product.name}" (Rs. ${item.unitPrice}) cannot be less than cost price (Rs. ${Number(product.costPrice)})`,
          }, 400);
        }
      }

      // Check inventory availability in selected warehouse
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { productId_warehouseId: { productId, warehouseId: warehouseId! } },
      });
      const available = inventoryItem?.availableQuantity ?? 0;
      if (available < item.quantity) {
        return c.json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${available}, Required: ${item.quantity}`,
        }, 400);
      }

      itemsWithCost.push({
        productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: product.costPrice != null ? Number(product.costPrice) : null,
        totalPrice: item.quantity * item.unitPrice,
      });
    }

    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const discountType = data.discountValue ? data.discountType ?? "FIXED" : data.discountType;
    const discount = resolveDiscount(subtotal, discountType, data.discountValue ?? 0);
    if (discount.error) {
      return c.json({ success: false, message: discount.error }, 400);
    }
    const totalAmount = discount.invoiceTotal;

    const amountPaid = data.amountPaid ?? 0;
    if (amountPaid > totalAmount) {
      return c.json({
        success: false,
        message: `Amount paid (${amountPaid}) cannot exceed order total (${totalAmount})`,
      }, 400);
    }

    let paymentStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
    if (amountPaid <= 0) {
      paymentStatus = "UNPAID";
    } else if (amountPaid >= totalAmount) {
      paymentStatus = "PAID";
    } else {
      paymentStatus = "PARTIAL";
    }

    const created = await prisma.salesOrder.create({
      data: {
        orderNumber: `SO-TEMP-${Date.now()}`,
        customerId,
        warehouseId,
        notes: data.notes,
        totalAmount,
        discountType: discount.discountAmount > 0 ? (discountType ?? "FIXED") : null,
        discountValue: discount.discountAmount > 0 ? (data.discountValue ?? 0) : 0,
        discountAmount: discount.discountAmount,
        amountPaid,
        paymentStatus,
        paymentMethod: data.paymentMethod ?? null,
        createdBy: user.id,
        items: { create: itemsWithCost },
      },
    });

    const order = await prisma.salesOrder.update({
      where: { id: created.id },
      data: { orderNumber: `SO-${String(created.id).padStart(6, "0")}` },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        warehouse: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
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

    return c.json({ success: true, data: encoded }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
