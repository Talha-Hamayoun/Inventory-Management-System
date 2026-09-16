import { Context } from "hono";
import { compare } from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { generateToken } from "../../utils/auth";
import type { Validator } from "../../validators";
import { idParser } from "../../helpers/idParser";
import { setCookie } from "hono/cookie";

export async function loginController(c: Context) {

    try {

        const { email, password } = await c.req.json() as Validator["Login"];

        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });

        if (!user) {
            return c.json({ success: false, message: "Invalid credentials" }, 401);
        }

        if (!user.isActive) {
            return c.json({ success: false, message: "Account is deactivated" }, 403);
        }

        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
            return c.json({ success: false, message: "Invalid credentials" }, 401);
        }

        const { token, expiresAt } = await generateToken(user);

        await prisma.session.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });

        setCookie(c, "token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60,
        });

        return c.json({
            success: true,
            data: {
                user: {
                    id: idParser.encode(user.id),
                    name: user.name,
                    email: user.email,
                    role: {
                        ...user.role,
                        id: idParser.encode(user.role.id),
                    },
                },
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return c.json({ success: false, message: "Login failed" }, 500);
    }
}
