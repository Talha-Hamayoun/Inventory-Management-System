import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function createProductController(c: Context) {
  try {
    const data = await c.req.json() as Validator["CreateProduct"];
    const user = getAuthUser(c)!;

    let categoryId = null;
    if (data.categoryId) {
      categoryId = idParser.decode(data.categoryId);
      if (categoryId === null) {
        return c.json({ success: false, message: "Invalid category ID" }, 400);
      }
    }

    const duplicateSku = await prisma.product.findFirst({
      where: {
        sku: data.sku,
        isDeleted: false,
      },
    });

    if (duplicateSku) {
      return c.json({ success: false, message: "SKU already exists" }, 400);
    }

    const deletedDuplicateSku = await prisma.product.findFirst({
      where: {
        sku: data.sku,
        isDeleted: true,
      },
    });

    if (deletedDuplicateSku) {
      return c.json({
        success: false,
        message: "A product with the same SKU was previously deleted. Please choose a different SKU.",
      }, 400);
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        sku: data.sku,
        categoryId,
        status: data.status,
        unitOfMeasure: data.unitOfMeasure,
        barcode: data.barcode,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entityType: "Product",
      entityId: product.id,
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

    return c.json({ success: true, data: responseProduct }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
