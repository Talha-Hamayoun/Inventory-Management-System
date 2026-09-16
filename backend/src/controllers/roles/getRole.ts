import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getRoleController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    if (id === null) {
      return c.json({ success: false, message: "Invalid role ID" }, 400);
    }
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) {
      return c.json({ success: false, message: "Role not found" }, 404);
    }
    const responseRole = {
      ...role,
      id: idParser.encode(role.id),
    };
    return c.json({ success: true, data: responseRole });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
