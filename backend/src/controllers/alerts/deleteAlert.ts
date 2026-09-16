import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function deleteAlertController(c: Context) {

    try {

        const hashedId = c.req.param("id");

        const id = idParser.decode(hashedId);

        const user = getAuthUser(c)!;

        if (id === null) {
            return c.json({ success: false, message: "Invalid alert ID" }, 400);
        }

        const existing = await prisma.stockAlert.findUnique({ where: { id } });
        if (!existing) {
            return c.json({ success: false, message: "Alert not found" }, 404);
        }

        await prisma.stockAlert.delete({ where: { id } });

        await createAuditLog({
            userId: user.id,
            action: "DELETE",
            entityType: "StockAlert",
            entityId: id,
            oldValues: existing,
            ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
            userAgent: c.req.header("user-agent"),
        });

        return c.json({ success: true, message: "Alert deleted successfully" });
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
}
