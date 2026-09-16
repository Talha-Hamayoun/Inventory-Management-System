import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

type ZodSchema = z.ZodType;
type ValidationTarget = "json" | "query" | "param" | "header";

export function apiValidator(target: ValidationTarget, schema: ZodSchema) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Invalid request data",
          errors: result.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
        400
      );
    }
  });
}
