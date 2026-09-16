import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function updateCustomerController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const data = await c.req.json() as Validator["UpdateCustomer"];
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid customer ID" }, 400);
    }

    const existing = await prisma.customer.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return c.json({ success: false, message: "Customer not found" }, 404);
    }

    if (data.email) {
      const emailExists = await prisma.customer.findFirst({
        where: { email: data.email, isDeleted: false, id: { not: id } },
      });
      if (emailExists) {
        return c.json({ success: false, message: "A customer with this email already exists" }, 409);
      }
    }

    if (data.phone) {
      const phoneExists = await prisma.customer.findFirst({
        where: { phone: data.phone, isDeleted: false, id: { not: id } },
      });
      if (phoneExists) {
        return c.json({ success: false, message: "A customer with this phone number already exists" }, 409);
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "Customer",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({
      success: true,
      data: { ...customer, id: idParser.encode(customer.id) },
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
