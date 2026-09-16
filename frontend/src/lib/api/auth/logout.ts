import type { ApiResponse } from "@/src/types/ApiResponse";
import apiClient from "../client";

// Types
interface LogoutResponseData {
    message: string;
}

type LogoutResponse = ApiResponse<{ data: LogoutResponseData }>;

export async function logout() {
    try {
        const response = await apiClient.post("/auth/logout");

        return { data: response.data as LogoutResponse, status: response.status };
    } catch (error) {
        return { error };
    }
}
