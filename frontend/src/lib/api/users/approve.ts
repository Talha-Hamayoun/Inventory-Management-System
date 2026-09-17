import type { ApiResponse } from "@/src/types/ApiResponse.d";
import apiClient from "../client";

type ApproveUserResponse = ApiResponse<{ data: unknown; message: string }>;

export async function approveUser(id: string) {
  try {
    const response = await apiClient.post(`/users/${id}/approve`);
    return { data: response.data as ApproveUserResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
