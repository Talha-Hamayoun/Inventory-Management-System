import { z } from "zod";

const pakistaniPhone = z
  .string()
  .regex(/^03\d{9}$/, "Phone must be exactly 11 digits starting with 03 (e.g. 03001234567)");

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: pakistaniPhone,
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
