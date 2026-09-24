import { createAuditLog } from "@/utils/audit";
import { Context } from "hono";
import { idParser } from "../../helpers/idParser";
import { prisma } from "../../lib/prisma";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";

export async function updatePaymentController(c: Context) {
  try {
    const id = idParser.decode(c.req.param("id"));
    if (id === null) return c.json({ success: false, message: "Invalid ID" }, 400);

    const { amountPaid, paymentMethod, amountReceived, changeDue } = (c.req as any).valid(
      "json"
    ) as Validator["UpdatePayment"];
    const user = getAuthUser(c)!;

    const order = await prisma.salesOrder.findFirst({
      where: { id, isDeleted: false },
      select: {
        id: true,
        totalAmount: true,
        paymentStatus: true,
        amountPaid: true,
        paymentMethod: true,
        amountReceived: true,
        changeDue: true,
      },
    });

    if (!order) return c.json({ success: false, message: "Sales order not found" }, 404);

    const total = Number(order.totalAmount);

    if (amountPaid > total + 0.001) {
      return c.json(
        {
          success: false,
          message: `Amount paid (${amountPaid}) cannot exceed order total (${total})`,
        },
        400
      );
    }

    let paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
    if (amountPaid <= 0) {
      paymentStatus = "UNPAID";
    } else if (amountPaid >= total) {
      paymentStatus = "PAID";
    } else {
      paymentStatus = "PARTIAL";
    }

    const nextMethod = paymentMethod ?? order.paymentMethod ?? null;
    let nextReceived =
      amountReceived !== undefined
        ? amountReceived
        : order.amountReceived != null
          ? Number(order.amountReceived)
          : amountPaid;
    let nextChange =
      changeDue !== undefined
        ? changeDue
        : order.changeDue != null
          ? Number(order.changeDue)
          : 0;

    if (nextMethod === "CASH") {
      if (amountReceived !== undefined) {
        nextReceived = amountReceived;
      } else if (amountReceived === undefined && changeDue === undefined) {
        // keep existing received if present, else default to amount paid
        nextReceived =
          order.amountReceived != null ? Number(order.amountReceived) : amountPaid;
      }
      if (nextReceived + 0.001 < total) {
        return c.json(
          {
            success: false,
            message: `Cash received (${nextReceived}) cannot be less than order total (${total})`,
          },
          400
        );
      }
      nextChange =
        changeDue !== undefined
          ? changeDue
          : Math.max(0, Math.round((nextReceived - total) * 100) / 100);
    } else {
      nextReceived = amountPaid;
      nextChange = 0;
    }

    const updated = await prisma.salesOrder.update({
      where: { id },
      data: {
        amountPaid,
        paymentStatus,
        paymentMethod: nextMethod,
        amountReceived: nextReceived,
        changeDue: nextChange,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        warehouse: { select: { id: true, name: true } },
        createdByUser: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    await createAuditLog({
      action: "UPDATE",
      entityType: "SalesOrder",
      entityId: id,
      userId: user.id,
      oldValues: {
        amountPaid: order.amountPaid,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        amountReceived: order.amountReceived,
        changeDue: order.changeDue,
      },
      newValues: {
        amountPaid,
        paymentStatus,
        paymentMethod: nextMethod,
        amountReceived: nextReceived,
        changeDue: nextChange,
      },
      ipAddress: c.req.header("x-forwarded-for") || "",
      userAgent: c.req.header("user-agent") || "",
    });

    return c.json({
      success: true,
      message: `Payment updated — ${paymentStatus}`,
      data: {
        ...updated,
        id: idParser.encode(updated.id),
        customerId: idParser.encode(updated.customerId),
        warehouseId: idParser.encode(updated.warehouseId),
        createdBy: idParser.encode(updated.createdBy),
        customer: {
          ...updated.customer,
          id: idParser.encode(updated.customer.id),
        },
        warehouse: {
          ...updated.warehouse,
          id: idParser.encode(updated.warehouse.id),
        },
        createdByUser: updated.createdByUser
          ? {
              ...updated.createdByUser,
              id: idParser.encode(updated.createdByUser.id),
            }
          : undefined,
        items: updated.items.map((item) => ({
          ...item,
          id: idParser.encode(item.id),
          salesOrderId: idParser.encode(item.salesOrderId),
          productId: idParser.encode(item.productId),
          product: {
            ...item.product,
            id: idParser.encode(item.product.id),
          },
        })),
      },
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
