import apiClient from "../client";
import type { SupplierMutationResponse } from "./types";

export interface UpdateSupplierRequest {
  name?: string;
  code?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
  notes?: string;
  isActive?: boolean;
}

export async function updateSupplier(id: string, data: UpdateSupplierRequest) {
  try {
    const response = await apiClient.put(`/suppliers/${id}`, data);
    return { data: response.data as SupplierMutationResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
