import type { ListCustomersResponse } from "./types";
import apiClient from "../client";

export async function listCustomers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const response = await apiClient.get("/customers", { params });
    return { data: response.data as ListCustomersResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
