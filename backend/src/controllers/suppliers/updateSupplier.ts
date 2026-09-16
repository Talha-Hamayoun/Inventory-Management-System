import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function updateSupplierController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const data = await c.req.json() as Validator["UpdateSupplier"];
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid supplier ID" }, 400);
    }

    const existing = await prisma.supplier.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return c.json({ success: false, message: "Supplier not found" }, 404);
    }

    if (data.name) {
      const nameExists = await prisma.supplier.findFirst({
        where: { name: data.name, isDeleted: false, id: { not: id } },
      });
      if (nameExists) {
        return c.json({ success: false, message: "A supplier with this name already exists" }, 409);
      }
    }

    if (data.code) {
      const codeExists = await prisma.supplier.findFirst({
        where: { code: data.code, isDeleted: false, id: { not: id } },
      });
      if (codeExists) {
        return c.json({ success: false, message: "A supplier with this code already exists" }, 409);
      }
    }

    if (data.email) {
      const emailExists = await prisma.supplier.findFirst({
        where: { email: data.email, isDeleted: false, id: { not: id } },
      });
      if (emailExists) {
        return c.json({ success: false, message: "A supplier with this email already exists" }, 409);
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "Supplier",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const responseSupplier = {
      ...supplier,
      id: idParser.encode(supplier.id),
    };

    return c.json({ success: true, data: responseSupplier });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
