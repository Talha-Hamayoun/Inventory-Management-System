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

type GetUserResponse = ApiResponse<{ data: User }>;

export async function getUser(id: string) {
  try {
    const response = await apiClient.get(`/users/${id}`);

    return { data: response.data as GetUserResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
