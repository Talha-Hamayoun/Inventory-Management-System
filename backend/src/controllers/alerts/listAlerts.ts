import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listAlertsController(c: Context) {

    try {

        const { page, limit } = (c.req as any).valid("query") as Validator["Pagination"];

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.stockAlert.findMany({
                include: {
                    product: { select: { id: true, name: true, sku: true } },
                    warehouse: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.stockAlert.count(),
        ]);

        const encodedData = data.map(alert => ({
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
        }));

        return c.json({
            success: true,
            data: encodedData,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });

    } catch (error) {
        return c.json({ success: false, message: (error as Error).message }, 500);
    }
}
