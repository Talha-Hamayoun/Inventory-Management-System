import apiClient from "../client";
import type { DashboardStatsResponse } from "./types";

export async function getDashboardStats() {
  try {
    const response = await apiClient.get("/dashboard/stats");
    return { data: response.data as DashboardStatsResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
