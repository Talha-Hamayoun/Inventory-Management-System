import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listUsersController(c: Context) {
  try {
    const { page, limit, search, roleId, accountStatus } = (c.req as any).valid("query") as Validator["UserQuery"];
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ];
    }

    if (roleId) {
      const decodedRoleId = idParser.decode(roleId);
      if (decodedRoleId !== null) {
        where.roleId = decodedRoleId;
      }
    }

    if (accountStatus) {
      where.accountStatus = accountStatus;
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          emailVerified: true,
          accountStatus: true,
          rejectionReason: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } },
          sessions: {
            select: { createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const encodedData = data.map((user) => {
      const { sessions, ...rest } = user;
      return {
        ...rest,
        lastLoginAt: sessions[0]?.createdAt ?? null,
        id: idParser.encode(user.id),
        role: user.role
          ? {
              ...user.role,
              id: idParser.encode(user.role.id),
            }
          : null,
      };
    });
    return c.json({
      success: true,
      data: encodedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
