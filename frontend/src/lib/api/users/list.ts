import type { ApiResponse } from "@/src/types/ApiResponse.d";
import apiClient from "../client";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AccountStatus =
  | "PENDING_EMAIL_VERIFICATION"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  emailVerified: boolean;
  accountStatus: AccountStatus;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  role: { id: string; name: string } | null;
}

type ListUsersResponse = ApiResponse<{
  data: User[];
  pagination: PaginationData;
}>;

export async function listUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  accountStatus?: AccountStatus;
}) {
  try {
    const response = await apiClient.get("/users", { params });

    return { data: response.data as ListUsersResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
