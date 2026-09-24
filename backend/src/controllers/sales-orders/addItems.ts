import { createAuditLog } from "@/utils/audit";
import { Context } from "hono";
import { idParser } from "../../helpers/idParser";
import { prisma } from "../../lib/prisma";
import { resolveDiscount } from "../../lib/salesOrderDiscount";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";

type DiscountType = "FIXED" | "PERCENTAGE";

function encodeOrder(order: {
  id: number;
  customerId: number;
  warehouseId: number;
  createdBy: number;
  customer: { id: number; name: string; phone: string; email?: string | null; address?: string | null };
  warehouse: { id: number; name: string };
  createdByUser?: { id: number; name: string } | null;
  items: Array<{
    id: number;
    salesOrderId: number;
    productId: number;
    product: { id: number; name: string; sku: string | null };
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}) {
  return {
    ...order,
    id: idParser.encode(order.id),
    customerId: idParser.encode(order.customerId),
    warehouseId: idParser.encode(order.warehouseId),
    createdBy: idParser.encode(order.createdBy),
    customer: {
      ...order.customer,
      id: idParser.encode(order.customer.id),
    },
    warehouse: {
      ...order.warehouse,
      id: idParser.encode(order.warehouse.id),
    },
    createdByUser: order.createdByUser
      ? {
          ...order.createdByUser,
          id: idParser.encode(order.createdByUser.id),
        }
      : undefined,
    items: order.items.map((item) => ({
      ...item,
      id: idParser.encode(item.id),
      salesOrderId: idParser.encode(item.salesOrderId),
      productId: idParser.encode(item.productId),
      product: {
        ...item.product,
        id: idParser.encode(item.product.id),
      },
    })),
  };
}

export async function addSalesOrderItemsController(c: Context) {
  try {
    const id = idParser.decode(c.req.param("id"));
    if (id === null) return c.json({ success: false, message: "Invalid ID" }, 400);

    const data = (c.req as any).valid("json") as Validator["AddSalesOrderItems"];
    const user = getAuthUser(c)!;

    const order = await prisma.salesOrder.findFirst({
      where: { id, isDeleted: false },
      include: {
        items: true,
      },
    });

    if (!order) return c.json({ success: false, message: "Sales order not found" }, 404);

    if (order.status !== "FULFILLED") {
      return c.json(
        { success: false, message: "Items can only be added to fulfilled (completed) sales" },
        400
      );
    }

    const warehouseId = order.warehouseId;

    const incomingRaw: {
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
        return c.json(
          {
            success: false,
            message: `Unit price for "${product.name}" cannot be less than cost price`,
          },
          400
        );
      }

      incomingRaw.push({
        productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: product.costPrice != null ? Number(product.costPrice) : null,
        totalPrice: item.quantity * item.unitPrice,
        productName: product.name,
      });
    }

    // Collapse duplicate product+price rows from the request
    const mergeKey = (productId: number, unitPrice: number) => `${productId}:${unitPrice}`;
    const incomingMap = new Map<string, (typeof incomingRaw)[number]>();
    for (const item of incomingRaw) {
      const key = mergeKey(item.productId, item.unitPrice);
      const prev = incomingMap.get(key);
      if (prev) {
        prev.quantity += item.quantity;
        prev.totalPrice = prev.quantity * prev.unitPrice;
      } else {
        incomingMap.set(key, { ...item });
      }
    }
    const incoming = Array.from(incomingMap.values());

    const stockNeed = new Map<number, { qty: number; name: string }>();
    for (const item of incoming) {
      const prev = stockNeed.get(item.productId);
      stockNeed.set(item.productId, {
        qty: (prev?.qty ?? 0) + item.quantity,
        name: item.productName,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const [productId, need] of stockNeed) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { productId_warehouseId: { productId, warehouseId } },
        });
        const available = inventoryItem?.availableQuantity ?? 0;
        if (!inventoryItem || available < need.qty) {
          throw new Error(
            `Insufficient stock for "${need.name}". Available: ${available}, Required: ${need.qty}`
          );
        }
      }

      for (const item of incoming) {
        const existingLine = order.items.find(
          (line) =>
            line.productId === item.productId &&
            Number(line.unitPrice) === item.unitPrice
        );

        if (existingLine) {
          const nextQty = existingLine.quantity + item.quantity;
          await tx.salesOrderItem.update({
            where: { id: existingLine.id },
            data: {
              quantity: nextQty,
              totalPrice: nextQty * item.unitPrice,
              unitCost: item.unitCost ?? existingLine.unitCost,
            },
          });
        } else {
          await tx.salesOrderItem.create({
            data: {
              salesOrderId: id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost,
              totalPrice: item.totalPrice,
            },
          });
        }

        const stocked = await tx.inventoryItem.updateMany({
          where: {
            productId: item.productId,
            warehouseId,
            availableQuantity: { gte: item.quantity },
          },
          data: { availableQuantity: { decrement: item.quantity } },
        });

        if (stocked.count !== 1) {
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
            referenceId: id,
            performedBy: user.id,
            notes: `Added to completed sale ${order.orderNumber}`,
          },
        });
      }

      const allItems = await tx.salesOrderItem.findMany({
        where: { salesOrderId: id },
      });

      const subtotal = allItems.reduce((sum, line) => sum + Number(line.totalPrice), 0);
      const discountType = order.discountType as DiscountType | null;
      const discountValue = Number(order.discountValue ?? 0);
      const discount = resolveDiscount(subtotal, discountType, discountValue);
      if (discount.error) {
        throw new Error(discount.error);
      }
      const totalAmount = discount.invoiceTotal;

      const nextMethod = data.paymentMethod ?? order.paymentMethod ?? "CASH";
      let amountPaid =
        data.amountPaid !== undefined ? data.amountPaid : Number(order.amountPaid);

      if (amountPaid > totalAmount + 0.001) {
        throw new Error(
          `Amount paid (${amountPaid}) cannot exceed order total (${totalAmount})`
        );
      }

      // If cashier didn't send a new paid amount, keep previous; may become PARTIAL
      let paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
      if (amountPaid <= 0) paymentStatus = "UNPAID";
      else if (amountPaid + 0.001 >= totalAmount) {
        paymentStatus = "PAID";
        amountPaid = totalAmount;
      } else paymentStatus = "PARTIAL";

      let amountReceived =
        data.amountReceived !== undefined
          ? data.amountReceived
          : order.amountReceived != null
            ? Number(order.amountReceived)
            : amountPaid;
      let changeDue =
        data.changeDue !== undefined
          ? data.changeDue
          : order.changeDue != null
            ? Number(order.changeDue)
            : 0;

      if (nextMethod === "CASH") {
        if (data.amountReceived !== undefined) amountReceived = data.amountReceived;
        if (amountReceived + 0.001 < totalAmount && paymentStatus === "PAID") {
          throw new Error(
            `Cash received (${amountReceived}) cannot be less than order total (${totalAmount})`
          );
        }
        changeDue =
          data.changeDue !== undefined
            ? data.changeDue
            : Math.max(0, Math.round((amountReceived - totalAmount) * 100) / 100);
      } else {
        amountReceived = amountPaid;
        changeDue = 0;
      }

      return tx.salesOrder.update({
        where: { id },
        data: {
          totalAmount,
          discountAmount: discount.discountAmount,
          amountPaid,
          paymentStatus,
          paymentMethod: nextMethod,
          amountReceived,
          changeDue,
        },
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
    });

    await createAuditLog({
      action: "UPDATE",
      entityType: "SalesOrder",
      entityId: id,
      userId: user.id,
      oldValues: {
        totalAmount: order.totalAmount,
        amountPaid: order.amountPaid,
        paymentStatus: order.paymentStatus,
        itemCount: order.items.length,
      },
      newValues: {
        totalAmount: updated.totalAmount,
        amountPaid: updated.amountPaid,
        paymentStatus: updated.paymentStatus,
        addedItems: data.items,
        itemCount: updated.items.length,
      },
      ipAddress: c.req.header("x-forwarded-for") || "",
      userAgent: c.req.header("user-agent") || "",
    });

    return c.json({
      success: true,
      message: "Items added to sale",
      data: encodeOrder(updated),
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
