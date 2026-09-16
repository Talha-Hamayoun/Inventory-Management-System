import type { CustomerDetailResponse } from "./types";
import apiClient from "../client";

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

export async function updateCustomer(id: string, data: UpdateCustomerRequest) {
  try {
    const response = await apiClient.put(`/customers/${id}`, data);
    return { data: response.data as CustomerDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
