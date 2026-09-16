import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getCustomerController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);

    if (id === null) {
      return c.json({ success: false, message: "Invalid customer ID" }, 400);
    }

    const customer = await prisma.customer.findFirst({
      where: { id, isDeleted: false },
    });

    if (!customer) {
      return c.json({ success: false, message: "Customer not found" }, 404);
    }

    return c.json({
      success: true,
      data: { ...customer, id: idParser.encode(customer.id) },
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
