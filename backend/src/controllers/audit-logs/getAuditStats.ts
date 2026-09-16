import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getAuditStatsController(c: Context) {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalLogs,
      last24Hours,
      last7Days,
      createCount,
      updateCount,
      deleteCount,
    ] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.auditLog.count({ where: { action: "CREATE" } }),
      prisma.auditLog.count({ where: { action: "UPDATE" } }),
      prisma.auditLog.count({ where: { action: "DELETE" } }),
    ]);

    const activeUsers = await prisma.auditLog.groupBy({
      by: ["userId"],
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 5,
    });

    const entityStats = await prisma.auditLog.groupBy({
      by: ["entityType"],
      _count: { entityType: true },
      orderBy: { _count: { entityType: "desc" } },
    });

    const encodedActiveUsers = activeUsers.map(u => ({
      ...u,
      userId: idParser.encode(u.userId),
    }));
    const encodedEntityStats = entityStats.map(e => ({
      ...e,
      _count: e._count,
    }));

    return c.json({
      success: true,
      data: {
        totalLogs,
        last24Hours,
        last7Days,
        byAction: {
          create: createCount,
          update: updateCount,
          delete: deleteCount,
        },
        topActiveUsers: encodedActiveUsers,
        byEntityType: encodedEntityStats,
      },
    });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
