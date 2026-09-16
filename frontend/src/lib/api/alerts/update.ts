import type { AlertDetailResponse } from "./types";
import apiClient from "../client";

export interface UpdateAlertRequest {
  threshold?: number;
  isActive?: boolean;
}

export async function updateAlert(id: string, data: UpdateAlertRequest) {
  try {
    const response = await apiClient.put(`/alerts/${id}`, data);
    return { data: response.data as AlertDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
