import type { ApiResponse } from "@/src/types/ApiResponse.d";
import apiClient from "../client";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

interface Role {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

type ListRolesResponse = ApiResponse<{
  data: Role[];
  pagination: PaginationData;
}>;

export async function listRoles(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const response = await apiClient.get("/roles", { params });

    return { data: response.data as ListRolesResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
