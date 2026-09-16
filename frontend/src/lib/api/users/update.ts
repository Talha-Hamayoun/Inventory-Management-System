import type { ApiResponse } from "@/src/types/ApiResponse.d";
import apiClient from "../client";

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: { id: string; name: string } | null;
}

type UpdateUserResponse = ApiResponse<{ data: User }>;

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
  isActive?: boolean;
}

export async function updateUser(id: string, data: UpdateUserRequest) {
  try {
    const response = await apiClient.put(`/users/${id}`, data);

    return {
      data: response.data as UpdateUserResponse,
      status: response.status,
    };
  } catch (error) {
    return { error };
  }
}
