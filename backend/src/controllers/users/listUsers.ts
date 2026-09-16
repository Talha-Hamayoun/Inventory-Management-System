import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listUsersController(c: Context) {
  try {
    const { page, limit, search } = (c.req as any).valid("query") as Validator["Pagination"];
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const encodedData = data.map(user => ({
      ...user,
      id: idParser.encode(user.id),
      role: user.role ? {
        ...user.role,
        id: idParser.encode(user.role.id),
      } : null,
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
