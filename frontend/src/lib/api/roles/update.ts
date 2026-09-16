import type { ApiResponse } from "@/src/types/ApiResponse.d";
import apiClient from "../client";

interface Role {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

type UpdateRoleResponse = ApiResponse<{ data: Role }>;

export interface UpdateRoleRequest {
  name?: string;
  permissions?: string[];
}

export async function updateRole(id: string, data: UpdateRoleRequest) {
  try {
    const response = await apiClient.put(`/roles/${id}`, data);

    return {
      data: response.data as UpdateRoleResponse,
      status: response.status,
    };
  } catch (error) {
    return { error };
  }
}
