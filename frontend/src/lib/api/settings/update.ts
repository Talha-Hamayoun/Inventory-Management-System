import apiClient from "../client";
import type { CompanySettings, SettingsResponse } from "./types";

export async function updateSettings(data: CompanySettings) {
  try {
    const response = await apiClient.put("/settings", data);
    return { data: response.data as SettingsResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
