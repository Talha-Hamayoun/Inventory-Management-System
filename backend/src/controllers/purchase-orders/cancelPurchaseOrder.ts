import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function cancelPurchaseOrderController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid purchase order ID" }, 400);
    }

    const po = await prisma.purchaseOrder.findFirst({
      where: { id, isDeleted: false },
    });

    if (!po) {
      return c.json({ success: false, message: "Purchase order not found" }, 404);
    }

    if (po.status === "COMPLETED") {
      return c.json({ success: false, message: "Cannot cancel a completed purchase order" }, 400);
    }

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "PurchaseOrder",
      entityId: id,
      oldValues: { status: po.status },
      newValues: { status: "CANCELLED" },
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const responsePO = {
      ...updatedPO,
      id: idParser.encode(updatedPO.id),
    };

    return c.json({ success: true, data: responsePO });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
