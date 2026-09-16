import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { createAuditLog } from "../../utils/audit";
import { getAuthUser } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

const createData = (data: Validator["CreateCategory"], parentId: number | null) => ({
  name: data.name,
  description: data.description,
  parentId,
  isActive: data.isActive ?? true,
});

export async function createCategoryController(c: Context) {
  try {
    const data = await c.req.json() as Validator["CreateCategory"];
    const user = getAuthUser(c)!;

    let parentId = null;
    if (data.parentId) {
      parentId = idParser.decode(data.parentId);
      if (parentId === null) {
        return c.json({ success: false, message: "Invalid parent category ID" }, 400);
      }
    }

    const existing = await prisma.category.findFirst({
      where: { name: data.name, parentId },
    });
    if (existing) {
      return c.json({ success: false, message: "A category with this name already exists" }, 409);
    }

    let category;
    try {
      category = await prisma.category.create({
        data: createData(data, parentId),
        include: { parent: { select: { id: true, name: true } } },
      });
    } catch (createError: unknown) {
      const err = createError as { code?: string; meta?: { target?: string[] } };
      if (err.code === "P2002" && err.meta?.target?.includes("id")) {
        await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Category"', 'id'), COALESCE((SELECT MAX(id) FROM "Category"), 0) + 1, false)`;
        category = await prisma.category.create({
          data: createData(data, parentId),
          include: { parent: { select: { id: true, name: true } } },
        });
      } else {
        throw createError;
      }
    }

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entityType: "Category",
      entityId: category.id,
      newValues: data,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    });

    const responseCategory = {
      ...category,
      id: idParser.encode(category.id),
      parent: category.parent ? {
        ...category.parent,
        id: idParser.encode(category.parent.id),
      } : null,
    };

    return c.json({ success: true, data: responseCategory }, 201);
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
