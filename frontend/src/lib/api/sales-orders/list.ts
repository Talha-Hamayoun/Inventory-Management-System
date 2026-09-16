import type { ListSalesOrdersResponse } from "./types";
import apiClient from "../client";

export async function listSalesOrders(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: "PENDING" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
  customerId?: string;
}) {
  try {
    const response = await apiClient.get("/sales-orders", { params });
    return { data: response.data as ListSalesOrdersResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
