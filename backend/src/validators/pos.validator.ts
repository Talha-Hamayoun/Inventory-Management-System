import { z } from "zod";
import { discountTypeEnum, paymentMethodEnum } from "./sales-order.validator";

const posCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
});

export const posCheckoutSchema = z.object({
  customerId: z.string().min(1).optional(),
  warehouseId: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(posCartItemSchema).min(1),
  paymentMethod: paymentMethodEnum,
  amountPaid: z.coerce.number().min(0),
  amountReceived: z.coerce.number().min(0).optional(),
  discountType: discountTypeEnum.optional(),
  discountValue: z.coerce.number().min(0).optional(),
  heldSaleId: z.string().optional(),
});

export const posProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(24),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  warehouseId: z.string().min(1),
});

export const posHoldSchema = z.object({
  label: z.string().max(120).optional(),
  warehouseId: z.string().min(1),
  customerId: z.string().optional().nullable(),
  cartData: z.object({
    items: z.array(
      z.object({
        productId: z.string(),
        name: z.string(),
        sku: z.string().nullable().optional(),
        barcode: z.string().nullable().optional(),
        unitPrice: z.number(),
        quantity: z.number().int().min(1),
        availableQuantity: z.number().int().min(0),
        categoryName: z.string().nullable().optional(),
      })
    ),
    discountType: discountTypeEnum.nullable().optional(),
    discountValue: z.number().min(0).optional(),
  }),
});

export type PosCheckoutInput = z.infer<typeof posCheckoutSchema>;
export type PosProductQuery = z.infer<typeof posProductQuerySchema>;
export type PosHoldInput = z.infer<typeof posHoldSchema>;
