import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function updatePurchaseOrderController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const data = await c.req.json() as Validator["UpdatePurchaseOrder"];
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid purchase order ID" }, 400);
    }

    const existing = await prisma.purchaseOrder.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return c.json({ success: false, message: "Purchase order not found" }, 404);
    }

    if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
      return c.json({ success: false, message: "Cannot update completed or cancelled purchase order" }, 400);
    }

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: data.status,
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
      },
      include: {
        supplier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        items: true,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "PurchaseOrder",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

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
      items: po.items.map(item => ({
        ...item,
        id: idParser.encode(item.id),
      })),
    };

    return c.json({ success: true, data: responsePO });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
