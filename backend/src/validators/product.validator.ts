import { z } from "zod";

export const productStatusEnum = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);
export const unitOfMeasureEnum = z.enum(["PCS", "KG", "LITERS", "METERS", "BOXES"]);

const priceFields = {
  costPrice: z.coerce.number().min(0, "Cost price must be non-negative").optional(),
  sellingPrice: z.coerce.number().min(0, "Selling price must be non-negative").optional(),
};

const priceRefine = (data: { costPrice?: number; sellingPrice?: number }) => {
  if (data.costPrice !== undefined && data.sellingPrice !== undefined) {
    return data.sellingPrice >= data.costPrice;
  }
  return true;
};

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  status: productStatusEnum.optional(),
  unitOfMeasure: unitOfMeasureEnum.optional(),
  barcode: z.string().optional(),
  ...priceFields,
}).refine(priceRefine, { message: "Selling price cannot be less than cost price", path: ["sellingPrice"] });

export const updateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  status: productStatusEnum.optional(),
  unitOfMeasure: unitOfMeasureEnum.optional(),
  barcode: z.string().optional(),
  ...priceFields,
}).refine(priceRefine, { message: "Selling price cannot be less than cost price", path: ["sellingPrice"] });

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  categoryId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
