import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { getAuthUser } from "../../utils/auth";

export async function logoutController(c: Context) {
  try {
    const user = getAuthUser(c);
    if (!user) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const cookies = c.req.header("Cookie");
    let token: string | undefined;
    if (cookies) {
      const tokenMatch = cookies.match(/token=([^;]+)/);
      token = tokenMatch ? tokenMatch[1] : undefined;
    }

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    c.header("Set-Cookie", "token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0");

    return c.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return c.json({ success: false, message: "Logout failed" }, 500);
  }
}