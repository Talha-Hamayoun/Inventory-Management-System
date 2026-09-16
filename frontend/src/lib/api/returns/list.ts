import type { ListReturnsResponse, ReturnStatus, ReturnType } from "./types";
import apiClient from "../client";

export async function listReturns(params?: {
  page?: number;
  limit?: number;
  returnType?: ReturnType;
  status?: ReturnStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const response = await apiClient.get("/returns", { params });
    return { data: response.data as ListReturnsResponse, status: response.status };
  } catch (error) {
    return { error };
  }
}
