import type { ApiResponse } from "@/src/types/ApiResponse";
import apiClient from "../client";

// Types
interface Role {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

interface MeResponseData {
  user: User & {
    role: Role;
  };
}

type MeResponse = ApiResponse<{ data: MeResponseData }>;

export async function me() {
    try {
        const response = await apiClient.get("/auth/me");

        return { data: response.data as MeResponse, status: response.status };
    } catch (error) {
        return { error };
    }
}
