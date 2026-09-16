import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  permissions: z.array(z.string()),
});

export const updateRoleSchema = createRoleSchema.partial();

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
