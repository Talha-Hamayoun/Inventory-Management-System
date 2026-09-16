import { Context } from "hono";
import { idParser } from "../../helpers/idParser";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";

export async function updateWarehouseController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const data = await c.req.json() as Validator["UpdateWarehouse"];
    const user = getAuthUser(c)!;
    if (id === null) {
      return c.json({ success: false, message: "Invalid warehouse ID" }, 400);
    }
    const existing = await prisma.warehouse.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return c.json({ success: false, message: "Warehouse not found" }, 404);
    }

    const duplicate = await prisma.warehouse.findFirst({
      where: {
        name: data.name
      }
    });

    if (duplicate && duplicate.id !== id) {
      return c.json({ success: false, message: "Warehouse with the same name already exists" }, 400);
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entityType: "Warehouse",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const responseWarehouse = {
      ...warehouse,
      id: idParser.encode(warehouse.id),
    };

    return c.json({ success: true, data: responseWarehouse });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
