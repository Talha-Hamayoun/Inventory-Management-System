import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { idParser } from "../../helpers/idParser";

export async function getUserController(c: Context) {
  try {
    const hashedId = c.req.param("id");
    const id = idParser.decode(hashedId);
    if (id === null) {
      return c.json({ success: false, message: "Invalid user ID" }, 400);
    }
    const user = await prisma.user.findUnique({
      where: { id },
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
        role: { select: { id: true, name: true, permissions: true } },
      },
    });
    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    const responseUser = {
      ...user,
      id: idParser.encode(user.id),
      role: user.role ? {
        ...user.role,
        id: idParser.encode(user.role.id),
      } : null,
    };
    return c.json({ success: true, data: responseUser });
  } catch (error) {
    return c.json({ success: false, message: (error as Error).message }, 500);
  }
}
