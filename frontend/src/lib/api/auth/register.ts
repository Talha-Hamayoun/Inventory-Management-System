import type { ApiResponse } from "@/src/types/ApiResponse";
import apiClient from "../client";

interface RegisterResponseData {
    email: string;
    requiresVerification: boolean;
    id?: string;
}

type RegisterResponse = ApiResponse<{ data: RegisterResponseData }>;

export async function register(body: { email: string; password: string; name: string }) {
    try {
        const response = await apiClient.post("/auth/register", body);

        return { data: response.data as RegisterResponse, status: response.status };
    } catch (error) {
        return { error };
    }
}
