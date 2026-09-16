import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getSupplierController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);

    if (id === null) {
      return c.json({ success: false, message: "Invalid supplier ID" }, 400);
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id, isDeleted: false },
      include: {
        _count: { select: { purchaseOrders: true } },
        purchaseOrders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            totalCost: true,
            createdAt: true,
          },
        },
      },
    });

    if (!supplier) {
      return c.json({ success: false, message: "Supplier not found" }, 404);
    }

    const responseSupplier = {
      ...supplier,
      id: idParser.encode(supplier.id),
      purchaseOrders: supplier.purchaseOrders.map(po => ({
        ...po,
        poNumber: `PO-${String(po.id).padStart(6, "0")}`,
        id: idParser.encode(po.id),
      })),
    };

    return c.json({ success: true, data: responseSupplier });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
