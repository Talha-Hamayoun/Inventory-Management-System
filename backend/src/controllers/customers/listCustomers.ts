import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listCustomersController(c: Context) {
  try {
    const { page, limit, search } = (c.req as any).valid("query") as Validator["CustomerQuery"];
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isDeleted: false };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    const encodedData = data.map((customer) => ({
      ...customer,
      id: idParser.encode(customer.id),
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
