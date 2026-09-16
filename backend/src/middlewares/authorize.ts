import type { Context, Next } from "hono";

export function authorize(permissions: string[] | string[][]) {

  const scopePairs: string[][] =
    permissions.length > 0 && Array.isArray(permissions[0])
      ? (permissions as string[][])
      : (permissions as string[]).map((p) => [p]);

  return async (c: Context, next: Next) => {
    const user = c.get("user")

    if (!user) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    if ((user.role.permissions as string[]).includes("*")) {
      await next();
      return;
    }

    const hasPermission = scopePairs.some((pair) =>
      pair.every((scope) => (user.role.permissions as string[]).includes(scope))
    );

    if (!hasPermission) {
      return c.json({ success: false, message: "Forbidden: Insufficient permissions" }, 403);
    }

    await next();
  };
}
