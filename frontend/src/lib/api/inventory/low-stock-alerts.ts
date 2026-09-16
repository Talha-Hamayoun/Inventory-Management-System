import apiClient from "../client";
import type { LowStockResponse } from "./types";

export async function getLowStockAlerts() {
  try {
    const response = await apiClient.get("/inventory/alerts/low-stock");
    return { data: response.data as LowStockResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
