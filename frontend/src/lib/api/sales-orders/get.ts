import type { SalesOrderDetailResponse } from "./types";
import apiClient from "../client";

export async function getSalesOrder(id: string) {
  try {
    const response = await apiClient.get(`/sales-orders/${id}`);
    return { data: response.data as SalesOrderDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
