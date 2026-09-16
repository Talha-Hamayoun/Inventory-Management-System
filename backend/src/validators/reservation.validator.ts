import { z } from "zod";

export const reservationStatusEnum = z.enum(["RESERVED", "RELEASED", "FULFILLED"]);

export const createStockReservationSchema = z.object({
  orderId: z.coerce.number().int().positive("Order ID must be a positive integer"),
  productId: z.string(),
  warehouseId: z.string(),
  quantity: z.number().int().positive(),
});

export const updateStockReservationSchema = z.object({
  status: reservationStatusEnum,
});

export const reservationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  orderId: z.string().optional(),
  status: z.enum(["RESERVED", "RELEASED", "FULFILLED"]).optional(),
  warehouseId: z.string().optional(),
});

export type CreateStockReservationInput = z.infer<typeof createStockReservationSchema>;
export type UpdateStockReservationInput = z.infer<typeof updateStockReservationSchema>;
