import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function listAuditLogsController(c: Context) {
  try {
    const { page, limit, entityType, entityId, userId, action, startDate, endDate } =
      (c.req as any).valid("query") as Validator["AuditQuery"];
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (entityId) {
      const decodedEntityId = idParser.decode(entityId);
      if (decodedEntityId === null) {
        return c.json({ success: false, message: "Invalid entity ID" }, 400);
      }
      where.entityId = decodedEntityId;
    }
    if (userId) {
      const decodedUserId = idParser.decode(userId);
      if (decodedUserId === null) {
        return c.json({ success: false, message: "Invalid user ID" }, 400);
      }
      where.userId = decodedUserId;
    }
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const encodedData = data.map(log => ({
      ...log,
      id: idParser.encode(log.id),
      user: {
        ...log.user,
        id: idParser.encode(log.user.id),
      },
      entityId: idParser.encode(log.entityId),
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
