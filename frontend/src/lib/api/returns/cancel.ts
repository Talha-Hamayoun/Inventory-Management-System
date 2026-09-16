import type { ReturnDetailResponse } from "./types";
import apiClient from "../client";

export async function cancelReturn(id: string) {
  try {
    const response = await apiClient.post(`/returns/${id}/cancel`);
    return { data: response.data as ReturnDetailResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
