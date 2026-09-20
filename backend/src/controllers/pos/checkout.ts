import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";
import { resolveDiscount } from "../../lib/salesOrderDiscount";

const WALK_IN_PHONE = "03000000000";
const WALK_IN_NAME = "Walk-in Customer";

async function ensureWalkInCustomer() {
  const existing = await prisma.customer.findFirst({
    where: { phone: WALK_IN_PHONE, isDeleted: false },
  });
  if (existing) {
    if (!existing.isActive) {
      return prisma.customer.update({
        where: { id: existing.id },
        data: { isActive: true, name: WALK_IN_NAME },
      });
    }
    return existing;
  }
  return prisma.customer.create({
    data: {
      name: WALK_IN_NAME,
      phone: WALK_IN_PHONE,
      isActive: true,
    },
  });
}

export async function posCheckoutController(c: Context) {
  try {
    const data = (c.req as any).valid("json") as Validator["PosCheckout"];
    const user = getAuthUser(c)!;

    const warehouseId = idParser.decode(data.warehouseId);
    if (warehouseId === null) {
      return c.json({ success: false, message: "Invalid warehouse ID" }, 400);
    }

    let customerId: number | null = null;
    if (data.customerId) {
      customerId = idParser.decode(data.customerId);
      if (customerId === null) {
        return c.json({ success: false, message: "Invalid customer ID" }, 400);
      }
    } else {
      const walkIn = await ensureWalkInCustomer();
      customerId = walkIn.id;
    }

    const [customer, warehouse] = await Promise.all([
      prisma.customer.findFirst({ where: { id: customerId!, isDeleted: false, isActive: true } }),
      prisma.warehouse.findFirst({ where: { id: warehouseId, isDeleted: false, isActive: true } }),
    ]);

    if (!customer) return c.json({ success: false, message: "Customer not found or inactive" }, 404);
    if (!warehouse) return c.json({ success: false, message: "Warehouse not found or inactive" }, 404);

    const itemsWithCost: {
      productId: number;
      quantity: number;
      unitPrice: number;
      unitCost: number | null;
      totalPrice: number;
      productName: string;
    }[] = [];

    for (const item of data.items) {
      const productId = idParser.decode(item.productId);
      if (productId === null) {
        return c.json({ success: false, message: "Invalid product ID in items" }, 400);
      }

      const product = await prisma.product.findFirst({
        where: { id: productId, isDeleted: false, status: "ACTIVE" },
      });
      if (!product) {
        return c.json({ success: false, message: `Product ${item.productId} not found` }, 404);
      }

      if (product.costPrice != null && item.unitPrice < Number(product.costPrice)) {
        return c.json({
          success: false,
          message: `Unit price for "${product.name}" cannot be less than cost price`,
        }, 400);
      }

      itemsWithCost.push({
        productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: product.costPrice != null ? Number(product.costPrice) : null,
        totalPrice: item.quantity * item.unitPrice,
        productName: product.name,
      });
    }

    const subtotal = itemsWithCost.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountType = data.discountValue ? data.discountType ?? "FIXED" : data.discountType;
    const discount = resolveDiscount(subtotal, discountType, data.discountValue ?? 0);
    if (discount.error) {
      return c.json({ success: false, message: discount.error }, 400);
    }
    const totalAmount = discount.invoiceTotal;

    if (data.amountPaid + 0.001 < totalAmount) {
      return c.json({
        success: false,
        message: `Amount paid (${data.amountPaid}) is less than total (${totalAmount})`,
      }, 400);
    }

    const amountReceived =
      data.paymentMethod === "CASH"
        ? data.amountReceived ?? data.amountPaid
        : data.amountReceived ?? totalAmount;

    if (data.paymentMethod === "CASH" && amountReceived + 0.001 < totalAmount) {
      return c.json({
        success: false,
        message: "Cash received cannot be less than the grand total",
      }, 400);
    }

    const changeDue =
      data.paymentMethod === "CASH"
        ? Math.max(0, Math.round((amountReceived - totalAmount) * 100) / 100)
        : 0;

    let heldSaleId: number | null = null;
    if (data.heldSaleId) {
      heldSaleId = idParser.decode(data.heldSaleId);
      if (heldSaleId === null) {
        return c.json({ success: false, message: "Invalid held sale ID" }, 400);
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      for (const item of itemsWithCost) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: {
            productId_warehouseId: { productId: item.productId, warehouseId },
          },
        });
        const available = inventoryItem?.availableQuantity ?? 0;
        if (!inventoryItem || available < item.quantity) {
          throw new Error(
            `Insufficient stock for "${item.productName}". Available: ${available}, Required: ${item.quantity}`
          );
        }
      }

      const created = await tx.salesOrder.create({
        data: {
          orderNumber: `SO-TEMP-${Date.now()}`,
          customerId: customerId!,
          warehouseId,
          status: "FULFILLED",
          notes: data.notes,
          totalAmount,
          discountType: discount.discountAmount > 0 ? (discountType ?? "FIXED") : null,
          discountValue: discount.discountAmount > 0 ? (data.discountValue ?? 0) : 0,
          discountAmount: discount.discountAmount,
          amountPaid: totalAmount,
          paymentStatus: "PAID",
          paymentMethod: data.paymentMethod,
          amountReceived,
          changeDue,
          createdBy: user.id,
          items: {
            create: itemsWithCost.map(({ productName: _n, ...rest }) => rest),
          },
        },
      });

      const withNumber = await tx.salesOrder.update({
        where: { id: created.id },
        data: { orderNumber: `SO-${String(created.id).padStart(6, "0")}` },
      });

      for (const item of itemsWithCost) {
        const updated = await tx.inventoryItem.updateMany({
          where: {
            productId: item.productId,
            warehouseId,
            availableQuantity: { gte: item.quantity },
          },
          data: { availableQuantity: { decrement: item.quantity } },
        });

        if (updated.count !== 1) {
          throw new Error(
            `Stock changed for "${item.productName}". Please refresh and try again.`
          );
        }

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            warehouseId,
            type: "OUT",
            quantity: item.quantity,
            referenceType: "ORDER",
            referenceId: withNumber.id,
            performedBy: user.id,
            notes: `POS sale ${withNumber.orderNumber}`,
          },
        });
      }

      if (heldSaleId !== null) {
        await tx.posHeldSale.deleteMany({
          where: { id: heldSaleId, createdBy: user.id },
        });
      }

      return tx.salesOrder.findUniqueOrThrow({
        where: { id: withNumber.id },
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true, address: true } },
          warehouse: { select: { id: true, name: true } },
          createdByUser: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, barcode: true } },
            },
          },
        },
      });
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entityType: "SalesOrder",
      entityId: order.id,
      newValues: { ...data, source: "POS", status: "FULFILLED" },
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
      createdByUser: order.createdByUser
        ? { ...order.createdByUser, id: idParser.encode(order.createdByUser.id) }
        : undefined,
      items: order.items.map((item) => ({
        ...item,
        id: idParser.encode(item.id),
        salesOrderId: idParser.encode(item.salesOrderId),
        productId: idParser.encode(item.productId),
        product: { ...item.product, id: idParser.encode(item.product.id) },
      })),
      subtotal,
      tax: 0,
    };

    return c.json({ success: true, data: encoded }, 201);
  } catch (error) {
    const message = (error as Error).message || "POS checkout failed";
    const status = message.includes("Insufficient") || message.includes("Stock changed") ? 400 : 500;
    return c.json({ success: false, message }, status);
  }
}

export async function getWalkInCustomerController(c: Context) {
  try {
    const customer = await ensureWalkInCustomer();
    return c.json({
      success: true,
      data: {
        id: idParser.encode(customer.id),
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        isWalkIn: true,
      },
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
