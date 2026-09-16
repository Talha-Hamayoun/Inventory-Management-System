import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function deleteProductController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    const user = getAuthUser(c)!;

    if (id === null) {
      return c.json({ success: false, message: "Invalid product ID" }, 400);
    }

    const existing = await prisma.product.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }

    await prisma.product.update({
      where: { id },
      data: { isDeleted: true, status: "ARCHIVED" },
    });

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entityType: "Product",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    return c.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
