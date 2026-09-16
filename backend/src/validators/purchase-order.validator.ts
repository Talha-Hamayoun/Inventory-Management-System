import { z } from "zod";

export const purchaseOrderStatusEnum = z.enum([
  "DRAFT",
  "ORDERED",
  "PARTIALLY_RECEIVED",
  "COMPLETED",
  "CANCELLED",
]);

export const purchaseOrderItemSchema = z.object({
  productId: z.string(),
  orderedQuantity: z.number().int().positive(),
  unitCost: z.number().positive(),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string(),
  warehouseId: z.string(),
  status: purchaseOrderStatusEnum.optional(),
  expectedDeliveryDate: z.string().datetime().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required"),
});

export const updatePurchaseOrderSchema = z.object({
  status: purchaseOrderStatusEnum.optional(),
  expectedDeliveryDate: z.string().datetime().optional(),
});

export const receivePurchaseOrderItemSchema = z.object({
  itemId: z.string(),
  receivedQuantity: z.number().int().positive(),
});

export const poQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  supplierId: z.string().optional(),
  warehouseId: z.string().optional(),
  status: z.enum(["DRAFT", "ORDERED", "PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"]).optional(),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
