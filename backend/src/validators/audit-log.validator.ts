import { z } from "zod";

export const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  action: z.enum(["CREATE", "UPDATE", "DELETE"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AuditQueryInput = z.infer<typeof auditQuerySchema>;
