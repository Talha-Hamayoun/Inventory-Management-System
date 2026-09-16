import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getTriggeredAlertsController(c: Context) {

    try {

        const alertsData = await prisma.stockAlert.findMany({
            where: { isActive: true },
            include: {
                product: { select: { id: true, name: true, sku: true } },
                warehouse: { select: { id: true, name: true } },
            },
        });

        const triggeredAlerts = [];

        for (const alert of alertsData) {

            const inventory = await prisma.inventoryItem.findUnique({
                where: {
                    productId_warehouseId: {
                        productId: alert.productId,
                        warehouseId: alert.warehouseId,
                    },
                },
            });

            const currentStock = inventory?.availableQuantity || 0;

            let isTriggered = false;
            if (alert.alertType === "LOW_STOCK") {
                isTriggered = currentStock > 0 && currentStock <= alert.threshold;
            } else if (alert.alertType === "OUT_OF_STOCK") {
                isTriggered = currentStock === 0;
            }

            if (isTriggered) {
                triggeredAlerts.push({
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
                    currentStock,
                });
            }
        }

        return c.json({ success: true, data: triggeredAlerts });
    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
}
