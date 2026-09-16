import type { ReturnStatsResponse } from "./types";
import apiClient from "../client";

export async function getReturnStats() {
  try {
    const response = await apiClient.get("/returns/stats/summary");
    return { data: response.data as ReturnStatsResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
