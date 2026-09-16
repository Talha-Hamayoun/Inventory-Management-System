import type { Context, Next } from "hono";

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error("Error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return c.json({ success: false, message: "A record with this value already exists" }, 409);
      }

      if (error.message.includes("Record to update not found")) {
        return c.json({ success: false, message: "Record not found" }, 404);
      }

      return c.json({ success: false, message: error.message }, 500);
    }

    return c.json({ success: false, message: "Internal server error" }, 500);
  }
}
