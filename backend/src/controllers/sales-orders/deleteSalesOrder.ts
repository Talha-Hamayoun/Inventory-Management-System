import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function deleteSalesOrderController(c: Context) {
  try {
    const id = idParser.decode(c.req.param("id"));
    if (id === null) return c.json({ success: false, message: "Invalid ID" }, 400);

    const user = getAuthUser(c)!;

    const order = await prisma.salesOrder.findFirst({ where: { id, isDeleted: false } });
    if (!order) return c.json({ success: false, message: "Sales order not found" }, 404);

    if (order.status !== "PENDING") {
      return c.json({ success: false, message: "Only PENDING orders can be deleted" }, 400);
    }

    await prisma.salesOrder.update({ where: { id }, data: { isDeleted: true } });

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entityType: "SalesOrder",
      entityId: id,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({ success: true, message: "Sales order deleted" });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
