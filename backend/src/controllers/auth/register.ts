import { Context } from "hono";
import { hash } from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { generateToken } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";

export async function registerController(c: Context) {
  try {
    const data = await c.req.json() as Validator["Register"];

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return c.json({ success: false, message: "User with this email already exists" }, 409);
    }

    let roleId = data.roleId ? idParser.decode(data.roleId) : null;
    if (!roleId) {
      const viewerRole = await prisma.role.findFirst({
        where: { name: "Viewer" },
      });
      if (!viewerRole) {
        return c.json({ success: false, message: "Default role not found. Please seed the database." }, 500);
      }
      roleId = viewerRole.id;
    }

    const hashedPassword = await hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        roleId,
      },
      include: { role: true },
    });

    const { token, expiresAt } = await generateToken(user);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    c.header("Set-Cookie", `token=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);

    return c.json(
      {
        success: true,
        data: {
          user: {
            id: idParser.encode(user.id),
            name: user.name,
            email: user.email,
            role: user.role.name,
            roleId: idParser.encode(user.role.id),
          },
        },
      },
      201
    );
  } catch (error) {
    console.error("Registration error:", error);
    return c.json({ success: false, message: "Registration failed. Please try again." }, 500);
  }
}
