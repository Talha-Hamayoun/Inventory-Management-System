import { z } from "zod";

const salesOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  notes: z.string().optional(),
  items: z.array(salesOrderItemSchema).min(1, "At least one item is required"),
});

export const updateSalesOrderSchema = z.object({
  customerId: z.string().optional(),
  warehouseId: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(salesOrderItemSchema).min(1).optional(),
});

export const updateSalesOrderStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "FULFILLED", "CANCELLED"]),
});

export const updatePaymentSchema = z.object({
  amountPaid: z.coerce.number().min(0, "Amount paid must be non-negative"),
  paymentMethod: z.enum(["CASH", "COD", "JAZZCASH", "EASYPAISA", "BANK_TRANSFER"]).optional(),
});

export const salesOrderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"]).optional(),
  customerId: z.string().optional(),
});

export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;
export type UpdateSalesOrderInput = z.infer<typeof updateSalesOrderSchema>;
export type UpdateSalesOrderStatusInput = z.infer<typeof updateSalesOrderStatusSchema>;
export type SalesOrderQuery = z.infer<typeof salesOrderQuerySchema>;
