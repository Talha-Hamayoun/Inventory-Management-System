import type { AlertDetailResponse } from "./types";
import apiClient from "../client";

export async function getAlert(id: string) {
  try {
    const response = await apiClient.get(`/alerts/${id}`);
    return { data: response.data as AlertDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
