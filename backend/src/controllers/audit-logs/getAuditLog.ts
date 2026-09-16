import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getAuditLogController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);

    if (id === null) {
      return c.json({ success: false, message: "Invalid audit log ID" }, 400);
    }

    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!log) {
      return c.json({ success: false, message: "Audit log not found" }, 404);
    }

    const responseLog = {
      ...log,
      id: idParser.encode(log.id),
      user: {
        ...log.user,
        id: idParser.encode(log.user.id),
      },
    };

    return c.json({ success: true, data: responseLog });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
