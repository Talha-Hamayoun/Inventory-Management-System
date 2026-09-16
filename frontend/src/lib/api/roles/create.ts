import type { ApiResponse } from "@/src/types/ApiResponse.d";
import apiClient from "../client";

interface Role {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

type CreateRoleResponse = ApiResponse<{ data: Role }>;

export interface CreateRoleRequest {
  name: string;
  permissions: string[];
}

export async function createRole(data: CreateRoleRequest) {
  try {
    const response = await apiClient.post("/roles", data);

    return {
      data: response.data as CreateRoleResponse,
      status: response.status,
    };
  } catch (error) {
    return { error };
  }
}
