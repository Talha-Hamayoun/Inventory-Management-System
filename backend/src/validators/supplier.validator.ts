import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  code: z.string().min(1, "Supplier code is required"),
  contactName: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  paymentTerms: z.string().optional(),
  leadTimeDays: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
