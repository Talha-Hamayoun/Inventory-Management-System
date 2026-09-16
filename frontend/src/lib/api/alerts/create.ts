import type { AlertDetailResponse, AlertType } from "./types";
import apiClient from "../client";

export interface CreateAlertRequest {
  productId: string;
  warehouseId: string;
  alertType: AlertType;
  threshold: number;
  isActive?: boolean;
}

export async function createAlert(data: CreateAlertRequest) {
  try {
    const response = await apiClient.post("/alerts", data);
    return { data: response.data as AlertDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
