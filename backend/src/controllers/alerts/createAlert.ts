import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function createAlertController(c: Context) {
  
    try {
    
    const data = await c.req.json() as Validator["CreateStockAlert"];

    const user = getAuthUser(c)!;

    const productId = idParser.decode(data.productId);

    const warehouseId = idParser.decode(data.warehouseId);

    if (productId === null) 
      return c.json({ success: false, message: "Invalid product ID" }, 400);
    
    if (warehouseId === null) 
      return c.json({ success: false, message: "Invalid warehouse ID" }, 400);

    const product = await prisma.product.findFirst({
      where: { id: productId, isDeleted: false },
    });

    if (!product) 
      return c.json({ success: false, message: "Product not found" }, 404);
    

    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, isDeleted: false },
    })

    if (!warehouse) 
      return c.json({ success: false, message: "Warehouse not found" }, 404);

    const alert = await prisma.stockAlert.create({
      data: {
        productId,
        warehouseId,
        alertType: data.alertType,
        threshold: data.threshold,
        isActive: data.isActive ?? true,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entityType: "StockAlert",
      entityId: alert.id,
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

    return c.json({ success: true, data: responseAlert }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
