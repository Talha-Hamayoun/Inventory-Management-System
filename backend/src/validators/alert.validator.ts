import { z } from "zod";

export const alertTypeEnum = z.enum(["LOW_STOCK", "OUT_OF_STOCK"]);

export const createStockAlertSchema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  alertType: alertTypeEnum,
  threshold: z.number().int().min(0),
  isActive: z.boolean().optional(),
});

export const updateStockAlertSchema = z.object({
  threshold: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateStockAlertInput = z.infer<typeof createStockAlertSchema>;
export type UpdateStockAlertInput = z.infer<typeof updateStockAlertSchema>;
