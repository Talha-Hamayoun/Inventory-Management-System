import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { getAuthUser } from "../../utils/auth";
import { idParser } from "../../helpers/idParser";

export async function meController(c: Context) {
  try {
    const authUser = getAuthUser(c);
    if (!authUser) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }

    const responseUser = {
      ...user,
      id: idParser.encode(user.id),
      role: {
        ...user.role,
        id: idParser.encode(user.role.id),
      },
    };

    return c.json({ success: true, data: { user: responseUser } });
  } catch (error) {
    console.error("Me error:", error);
    return c.json({ success: false, message: "Failed to fetch user" }, 500);
  }
}
