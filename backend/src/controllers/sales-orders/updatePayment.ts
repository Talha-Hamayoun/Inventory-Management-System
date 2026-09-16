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

    const { amountPaid, paymentMethod } = (c.req as any).valid("json") as Validator["UpdatePayment"];
    const user = getAuthUser(c)!;

    const order = await prisma.salesOrder.findFirst({
      where: { id, isDeleted: false },
      select: { id: true, totalAmount: true, paymentStatus: true, amountPaid: true },
    });

    if (!order) return c.json({ success: false, message: "Sales order not found" }, 404);

    if (amountPaid > Number(order.totalAmount)) {
      return c.json(
        { success: false, message: `Amount paid (${amountPaid}) cannot exceed order total (${order.totalAmount})` },
        400
      );
    }

    // Derive payment status from total paid
    let paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
    if (amountPaid <= 0) {
      paymentStatus = "UNPAID";
    } else if (amountPaid >= Number(order.totalAmount)) {
      paymentStatus = "PAID";
    } else {
      paymentStatus = "PARTIAL";
    }

    const updated = await prisma.salesOrder.update({
      where: { id },
      data: {
        amountPaid,
        paymentStatus,
        paymentMethod: paymentMethod ?? null,
      },
    });

    await createAuditLog({
      action: "UPDATE",
      entityType: "SalesOrder",
      entityId: id,
      userId: user.id,
      oldValues: { amountPaid: order.amountPaid, paymentStatus: order.paymentStatus },
      newValues: { amountPaid, paymentStatus, paymentMethod },
      ipAddress: c.req.header("x-forwarded-for") || "",
      userAgent: c.req.header("user-agent") || "",
    });

    return c.json({
      success: true,
      message: `Payment recorded — ${paymentStatus}`,
      data: {
        paymentStatus: updated.paymentStatus,
        amountPaid: updated.amountPaid,
        paymentMethod: updated.paymentMethod,
      },
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
