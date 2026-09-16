import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getAlertController(c: Context) {

    try {

        const hashedId = c.req.param("id");

        const id = idParser.decode(hashedId);

        if (id === null) {
            return c.json({ success: false, message: "Invalid alert ID" }, 400);
        }

        const alert = await prisma.stockAlert.findUnique({
            where: { id },
            include: {
                product: true,
                warehouse: true,
            },
        });

        if (!alert) {
            return c.json({ success: false, message: "Alert not found" }, 404);
        }

        const inventory = await prisma.inventoryItem.findUnique({
            where: {
                productId_warehouseId: {
                    productId: alert.productId,
                    warehouseId: alert.warehouseId,
                },
            },
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

        return c.json({
            success: true,
            data: {
                ...responseAlert,
                currentStock: inventory?.availableQuantity || 0,
            },
        });
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
}
