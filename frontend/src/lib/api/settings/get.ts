import apiClient from "../client";
import type { SettingsResponse } from "./types";

export async function getSettings() {
  try {
    const response = await apiClient.get("/settings");
    return { data: response.data as SettingsResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
