import type { TriggeredAlertsResponse } from "./types";
import apiClient from "../client";

export async function getTriggeredAlerts() {
  try {
    const response = await apiClient.get("/alerts/triggered");
    return { data: response.data as TriggeredAlertsResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
