import { z } from "zod";

export const createWarehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
