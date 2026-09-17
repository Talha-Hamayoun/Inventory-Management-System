import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  roleId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  roleId: z.string().optional(),
  accountStatus: z.enum([
    "PENDING_EMAIL_VERIFICATION",
    "PENDING_APPROVAL",
    "APPROVED",
    "REJECTED",
  ]).optional(),
});

export const rejectUserSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
