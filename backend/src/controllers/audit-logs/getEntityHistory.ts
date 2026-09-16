import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getEntityHistoryController(c: Context) {
  try {
    const entityType = c.req.param("entityType");
    const hashedEntityId = c.req.param("entityId");
    const entityId = idParser.decode(hashedEntityId);

    if (entityId === null) {
      return c.json({ success: false, message: "Invalid entity ID" }, 400);
    }

    const logs = await prisma.auditLog.findMany({
      where: { entityType, entityId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const encodedLogs = logs.map((log) => ({
      ...log,
      id: idParser.encode(log.id),
      user: {
        ...log.user,
        id: idParser.encode(log.user.id),
      },
      entityId: idParser.encode(log.entityId),
    }));

    return c.json({ success: true, data: encodedLogs });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
