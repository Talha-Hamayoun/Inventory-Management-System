import type { ReturnDetailResponse } from "./types";
import apiClient from "../client";

export async function processReturn(id: string) {
  try {
    const response = await apiClient.post(`/returns/${id}/process`);
    return { data: response.data as ReturnDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
