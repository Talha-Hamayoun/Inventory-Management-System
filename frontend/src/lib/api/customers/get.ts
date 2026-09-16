import type { CustomerDetailResponse } from "./types";
import apiClient from "../client";

export async function getCustomer(id: string) {
  try {
    const response = await apiClient.get(`/customers/${id}`);
    return { data: response.data as CustomerDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
