import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

function encodeHeld(sale: {
  id: number;
  label: string | null;
  warehouseId: number;
  customerId: number | null;
  cartData: unknown;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  warehouse?: { id: number; name: string };
  customer?: { id: number; name: string; phone: string } | null;
}) {
  return {
    id: idParser.encode(sale.id),
    label: sale.label,
    warehouseId: idParser.encode(sale.warehouseId),
    customerId: sale.customerId != null ? idParser.encode(sale.customerId) : null,
    cartData: sale.cartData,
    createdBy: idParser.encode(sale.createdBy),
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
    warehouse: sale.warehouse
      ? { id: idParser.encode(sale.warehouse.id), name: sale.warehouse.name }
      : undefined,
    customer: sale.customer
      ? {
          id: idParser.encode(sale.customer.id),
          name: sale.customer.name,
          phone: sale.customer.phone,
        }
      : null,
  };
}

export async function listHeldSalesController(c: Context) {
  try {
    const user = getAuthUser(c)!;
    const sales = await prisma.posHeldSale.findMany({
      where: { createdBy: user.id },
      include: {
        warehouse: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return c.json({
      success: true,
      data: sales.map(encodeHeld),
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}

export async function createHeldSaleController(c: Context) {
  try {
    const data = (c.req as any).valid("json") as Validator["PosHold"];
    const user = getAuthUser(c)!;

    const warehouseId = idParser.decode(data.warehouseId);
    if (warehouseId === null) {
      return c.json({ success: false, message: "Invalid warehouse ID" }, 400);
    }

    let customerId: number | null = null;
    if (data.customerId) {
      customerId = idParser.decode(data.customerId);
      if (customerId === null) {
        return c.json({ success: false, message: "Invalid customer ID" }, 400);
      }
    }

    if (!data.cartData.items.length) {
      return c.json({ success: false, message: "Cannot hold an empty cart" }, 400);
    }

    const sale = await prisma.posHeldSale.create({
      data: {
        label: data.label || `Hold ${new Date().toLocaleString()}`,
        warehouseId,
        customerId,
        cartData: data.cartData,
        createdBy: user.id,
      },
      include: {
        warehouse: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    return c.json({ success: true, data: encodeHeld(sale) }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}

export async function deleteHeldSaleController(c: Context) {
  try {
    const user = getAuthUser(c)!;
    const id = idParser.decode(c.req.param("id"));
    if (id === null) return c.json({ success: false, message: "Invalid ID" }, 400);

    const existing = await prisma.posHeldSale.findFirst({
      where: { id, createdBy: user.id },
    });
    if (!existing) {
      return c.json({ success: false, message: "Held sale not found" }, 404);
    }

    await prisma.posHeldSale.delete({ where: { id } });
    return c.json({ success: true, message: "Held sale deleted" });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
