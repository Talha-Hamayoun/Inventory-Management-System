import { z } from "zod";

export const createInventoryItemSchema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  availableQuantity: z.number().int().min(0).optional(),
  reservedQuantity: z.number().int().min(0).optional(),
  damagedQuantity: z.number().int().min(0).optional(),
  minimumStockLevel: z.number().int().min(0).optional(),
  maximumStockLevel: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  lastRestockedAt: z.string().datetime().optional(),
});

export const updateInventoryItemSchema = z.object({
  availableQuantity: z.number().int().min(0).optional(),
  reservedQuantity: z.number().int().min(0).optional(),
  damagedQuantity: z.number().int().min(0).optional(),
  minimumStockLevel: z.number().int().min(0).optional(),
  maximumStockLevel: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  lastRestockedAt: z.string().datetime().optional(),
});

export const movementTypeEnum = z.enum(["IN", "OUT", "ADJUST", "TRANSFER", "RETURN"]);
export const referenceTypeEnum = z.enum(["PO", "ORDER", "MANUAL", "TRANSFER", "RETURN"]);

export const createInventoryMovementSchema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  type: movementTypeEnum,
  quantity: z.number().int().min(0, "Quantity must be 0 or greater"),
  referenceType: referenceTypeEnum,
  referenceId: z.string().optional(),
  notes: z.string().optional(),
  fromWarehouseId: z.string().optional(),
  toWarehouseId: z.string().optional(),
});

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  warehouseId: z.string().optional(),
  productId: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
});

export const movementQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  warehouseId: z.string().optional(),
  productId: z.string().optional(),
  type: z.enum(["IN", "OUT", "ADJUST", "TRANSFER", "RETURN"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type CreateInventoryMovementInput = z.infer<typeof createInventoryMovementSchema>;
