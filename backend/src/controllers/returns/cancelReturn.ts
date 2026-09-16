import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";
import { encodeReturnOrder } from "./createReturn";

export async function cancelReturnController(c: Context) {
  try {
    const id = idParser.decode(c.req.param("id"));
    if (id === null) return c.json({ success: false, message: "Invalid return ID" }, 400);
    const user = getAuthUser(c)!;

    const returnOrder = await prisma.returnOrder.findUnique({ where: { id } });
    if (!returnOrder) return c.json({ success: false, message: "Return not found" }, 404);
    if (returnOrder.status !== "PENDING") {
      return c.json({ success: false, message: "Only PENDING returns can be cancelled" }, 400);
    }

    const updated = await prisma.returnOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        warehouse: { select: { id: true, name: true } },
        salesOrder: { select: { id: true, orderNumber: true } },
        purchaseOrder: { select: { id: true } },
        supplier: { select: { id: true, name: true } },
        processedByUser: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "ReturnOrder",
      entityId: id,
      newValues: { status: "CANCELLED" },
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({ success: true, data: encodeReturnOrder(updated) });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
