import type { ListAlertsResponse } from "./types";
import apiClient from "../client";

export async function listAlerts(params?: {
  page?: number;
  limit?: number;
}) {
  try {
    const response = await apiClient.get("/alerts", { params });
    return { data: response.data as ListAlertsResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
