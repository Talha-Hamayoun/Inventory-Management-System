import type { ApiResponse } from "@/src/types/ApiResponse.d";
import apiClient from "../client";

type DeleteRoleResponse = ApiResponse<{ message: string }>;

export async function deleteRole(id: string) {
  try {
    const response = await apiClient.delete(`/roles/${id}`);

    return { data: response.data as DeleteRoleResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
