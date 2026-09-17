import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function lookupProductByBarcodeController(c: Context) {
  try {
    const { barcode, warehouseId } = (c.req as any).valid("query") as Validator["ProductBarcodeLookup"];
    const decodedWarehouseId = idParser.decode(warehouseId);

    if (decodedWarehouseId === null) {
      return c.json({ success: false, message: "Please select a warehouse first" }, 400);
    }

    const warehouse = await prisma.warehouse.findFirst({
      where: { id: decodedWarehouseId, isDeleted: false, isActive: true },
      select: { id: true },
    });
    if (!warehouse) {
      return c.json({ success: false, message: "Please select a warehouse first" }, 400);
    }

    const product = await prisma.product.findFirst({
      where: {
        isDeleted: false,
        status: "ACTIVE",
        barcode: { equals: barcode.trim(), mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        costPrice: true,
        sellingPrice: true,
      },
    });

    if (!product) {
      return c.json({ success: false, message: "Barcode not found" }, 404);
    }

    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { productId_warehouseId: { productId: product.id, warehouseId: decodedWarehouseId } },
      select: { availableQuantity: true },
    });

    return c.json({
      success: true,
      data: {
        id: idParser.encode(product.id),
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        costPrice: product.costPrice != null ? Number(product.costPrice) : null,
        sellingPrice: product.sellingPrice != null ? Number(product.sellingPrice) : null,
        availableQuantity: inventoryItem?.availableQuantity ?? 0,
      },
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
