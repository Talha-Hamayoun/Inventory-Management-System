import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function createSupplierController(c: Context) {
  try {
    const data = await c.req.json() as Validator["CreateSupplier"];
    const user = getAuthUser(c)!;

    const nameExists = await prisma.supplier.findFirst({
      where: { name: data.name, isDeleted: false },
    });
    if (nameExists) {
      return c.json({ success: false, message: "A supplier with this name already exists" }, 409);
    }

    const codeExists = await prisma.supplier.findFirst({
      where: { code: data.code, isDeleted: false },
    });
    if (codeExists) {
      return c.json({ success: false, message: "A supplier with this code already exists" }, 409);
    }

    if (data.email) {
      const emailExists = await prisma.supplier.findFirst({
        where: { email: data.email, isDeleted: false },
      });
      if (emailExists) {
        return c.json({ success: false, message: "A supplier with this email already exists" }, 409);
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        code: data.code,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        paymentTerms: data.paymentTerms,
        leadTimeDays: data.leadTimeDays,
        notes: data.notes,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entityType: "Supplier",
      entityId: supplier.id,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const responseSupplier = {
      ...supplier,
      id: idParser.encode(supplier.id),
    };

    return c.json({ success: true, data: responseSupplier }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
