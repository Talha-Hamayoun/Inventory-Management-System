import type { ApiResponse } from "@/src/types/ApiResponse.d";
import apiClient from "../client";

type DeleteUserResponse = ApiResponse<{ message: string }>;

export async function deleteUser(id: string) {
  try {
    const response = await apiClient.delete(`/users/${id}`);

    return { data: response.data as DeleteUserResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
