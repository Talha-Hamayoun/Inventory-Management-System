import type { ApiResponse } from "@/src/types/ApiResponse.d";
import apiClient from "../client";

interface Role {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

type GetRoleResponse = ApiResponse<{ data: Role }>;

export async function getRole(id: string) {
  try {
    const response = await apiClient.get(`/roles/${id}`);

    return { data: response.data as GetRoleResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
