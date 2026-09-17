import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { generateUniqueBarcode } from "../../lib/barcode";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function generateProductBarcodeController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid product ID" }, 400);
    }

    const product = await prisma.product.findFirst({
      where: { id, isDeleted: false },
      select: { id: true, name: true, sku: true, barcode: true },
    });

    if (!product) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }

    if (product.barcode?.trim()) {
      return c.json({
        success: true,
        data: {
          id: idParser.encode(product.id),
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
        },
        generated: false,
      });
    }

    const barcode = await generateUniqueBarcode(id);
    const updated = await prisma.product.update({
      where: { id },
      data: { barcode },
      select: { id: true, name: true, sku: true, barcode: true },
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "Product",
      entityId: id,
      oldValues: { barcode: product.barcode },
      newValues: { barcode },
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({
      success: true,
      data: {
        id: idParser.encode(updated.id),
        name: updated.name,
        sku: updated.sku,
        barcode: updated.barcode,
      },
      generated: true,
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
