import apiClient from "../client";
import type { SupplierMutationResponse } from "./types";

export interface CreateSupplierRequest {
  name: string;
  code: string;
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

export async function createSupplier(data: CreateSupplierRequest) {
  try {
    const response = await apiClient.post("/suppliers", data);
    return { data: response.data as SupplierMutationResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
