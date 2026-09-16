import { z } from "zod";

export const returnConditionEnum = z.enum(["RESTOCKABLE", "DAMAGED"]);
export const returnTypeEnum = z.enum(["SALES_RETURN", "PURCHASE_RETURN"]);
export const returnStatusEnum = z.enum(["PENDING", "PROCESSED", "CANCELLED"]);

const returnItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  condition: returnConditionEnum,
});

export const createReturnSchema = z.object({
  returnType: returnTypeEnum,
  salesOrderId: z.string().optional(),
  purchaseOrderId: z.string().optional(),
  warehouseId: z.string().min(1, "Warehouse is required"),
  notes: z.string().optional(),
  items: z.array(returnItemSchema).min(1, "At least one item is required"),
});

// No body required for process/cancel — empty schema keeps existing type binding
export const processReturnSchema = z.object({});

export const returnQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  returnType: returnTypeEnum.optional(),
  status: returnStatusEnum.optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
