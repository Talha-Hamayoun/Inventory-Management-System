import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function updateAlertController(c: Context) {
    
    try {
        
        const hashedId = c.req.param("id");
        
        const id = idParser.decode(hashedId);
        
        const data = await c.req.json() as Validator["UpdateStockAlert"];

        const user = getAuthUser(c)!;

        if (id === null) {
            return c.json({ success: false, message: "Invalid alert ID" }, 400);
        }

        const existing = await prisma.stockAlert.findUnique({ where: { id } });
        if (!existing) {
            return c.json({ success: false, message: "Alert not found" }, 404);
        }

        const alert = await prisma.stockAlert.update({
            where: { id },
            data,
            include: {
                product: { select: { id: true, name: true, sku: true } },
                warehouse: { select: { id: true, name: true } },
            },
        });

        await createAuditLog({
            userId: user.id,
            action: "UPDATE",
            entityType: "StockAlert",
            entityId: id,
            oldValues: existing,
            newValues: data,
            ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
            userAgent: c.req.header("user-agent"),
        });

        const responseAlert = {
            ...alert,
            id: idParser.encode(alert.id),
            product: {
                ...alert.product,
                id: idParser.encode(alert.product.id),
            },
            warehouse: {
                ...alert.warehouse,
                id: idParser.encode(alert.warehouse.id),
            },
        };

        return c.json({ success: true, data: responseAlert });
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
}
