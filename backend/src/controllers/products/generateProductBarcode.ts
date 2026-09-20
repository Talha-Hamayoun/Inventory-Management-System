import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import {
  generateUniqueBarcode,
  isValidEan13,
  repairOrReplaceBarcode,
} from "../../lib/barcode";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function generateProductBarcodeController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const user = getAuthUser(c)!;
    const force = c.req.query("force") === "true";

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

    const existing = product.barcode?.trim() || "";

    // Valid barcode already assigned and not forcing → keep it
    if (existing && isValidEan13(existing) && !force) {
      return c.json({
        success: true,
        data: {
          id: idParser.encode(product.id),
          name: product.name,
          sku: product.sku,
          barcode: existing,
        },
        generated: false,
        repaired: false,
      });
    }

    let barcode: string;
    let repaired = false;
    let generated = false;

    if (existing && !isValidEan13(existing) && !force) {
      // Fix invalid check digit (keeps first 12 digits when possible)
      const result = await repairOrReplaceBarcode(existing, id);
      barcode = result.barcode;
      repaired = result.repaired;
      generated = !result.repaired;
    } else {
      barcode = await generateUniqueBarcode(id);
      generated = true;
    }

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
      generated,
      repaired,
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
