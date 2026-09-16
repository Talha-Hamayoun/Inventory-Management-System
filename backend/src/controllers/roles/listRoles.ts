import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listRolesController(c: Context) {
  try {
    const { page, limit, search } = (c.req as any).valid("query") as Validator["Pagination"];
    const skip = (page - 1) * limit;

    const where = search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {};

    const [data, total] = await Promise.all([
      prisma.role.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.role.count({ where }),
    ]);

    const encodedData = data.map(role => ({
      ...role,
      id: idParser.encode(role.id),
    }));
    return c.json({
      success: true,
      data: encodedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
