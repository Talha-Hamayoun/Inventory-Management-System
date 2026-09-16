import type { CustomerDetailResponse } from "./types";
import apiClient from "../client";

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  isActive?: boolean;
}

export async function createCustomer(data: CreateCustomerRequest) {
  try {
    const response = await apiClient.post("/customers", data);
    return { data: response.data as CustomerDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
