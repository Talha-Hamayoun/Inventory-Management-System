import type { ApiResponse } from "@/src/types/ApiResponse.d";
import apiClient from "../client";

type RejectUserResponse = ApiResponse<{ data: unknown; message: string }>;

export async function rejectUser(id: string, data?: { reason?: string }) {
  try {
    const response = await apiClient.post(`/users/${id}/reject`, data ?? {});
    return { data: response.data as RejectUserResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
