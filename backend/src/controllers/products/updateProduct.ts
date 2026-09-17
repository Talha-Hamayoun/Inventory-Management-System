import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function updateProductController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const data = await c.req.json() as Validator["UpdateProduct"];
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid product ID" }, 400);
    }

    let categoryId = null;
    if (data.categoryId) {
      categoryId = idParser.decode(data.categoryId);
      if (categoryId === null) {
        return c.json({ success: false, message: "Invalid category ID" }, 400);
      }
    }

    const existing = await prisma.product.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }

    const duplicateSku = await prisma.product.findFirst({
      where: {
        sku: data.sku,
        isDeleted: false,
        NOT: { id },
      },
    });

    if (duplicateSku) {
      return c.json({ success: false, message: "SKU already exists" }, 400);
    }

    const barcode = data.barcode !== undefined ? (data.barcode.trim() || null) : undefined;
    if (barcode) {
      const duplicateBarcode = await prisma.product.findFirst({
        where: {
          barcode,
          NOT: { id },
        },
      });
      if (duplicateBarcode) {
        return c.json({ success: false, message: "Barcode already exists" }, 400);
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        categoryId,
        ...(barcode !== undefined ? { barcode } : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "Product",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const responseProduct = {
      ...product,
      id: idParser.encode(product.id),
      category: product.category ? {
        ...product.category,
        id: idParser.encode(product.category.id),
      } : null,
    };

    return c.json({ success: true, data: responseProduct });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
