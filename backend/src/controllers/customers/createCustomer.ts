import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function createCustomerController(c: Context) {
  try {
    const data = await c.req.json() as Validator["CreateCustomer"];
    const user = getAuthUser(c)!;

    if (data.email) {
      const emailExists = await prisma.customer.findFirst({
        where: { email: data.email, isDeleted: false },
      });
      if (emailExists) {
        return c.json({ success: false, message: "A customer with this email already exists" }, 409);
      }
    }

    const phoneExists = await prisma.customer.findFirst({
      where: { phone: data.phone, isDeleted: false },
    });
    if (phoneExists) {
      return c.json({ success: false, message: "A customer with this phone number already exists" }, 409);
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entityType: "Customer",
      entityId: customer.id,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({
      success: true,
      data: { ...customer, id: idParser.encode(customer.id) },
    }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
