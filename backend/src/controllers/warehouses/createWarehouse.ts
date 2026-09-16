import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function createWarehouseController(c: Context) {
  try {
    const data = await c.req.json() as Validator["CreateWarehouse"];
    const user = getAuthUser(c)!;

    const existingWarehouse = await prisma.warehouse.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingWarehouse) {
      return c.json({ success: false, message: "Warehouse with the same name already exists" }, 400);
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: data.name,
        address: data.address,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entityType: "Warehouse",
      entityId: warehouse.id,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const responseWarehouse = {
      ...warehouse,
      id: idParser.encode(warehouse.id),
    };
    return c.json({ success: true, data: responseWarehouse }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
