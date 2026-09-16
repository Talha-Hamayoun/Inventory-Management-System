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

interface LoginResponseData {
    user: {
        id: string;
        name: string;
        email: string;
        role: Role;
    };
}

type LoginResponse = ApiResponse<{ data: LoginResponseData }>;

export async function login(body: { email: string; password: string }) {
    try {
        const response = await apiClient.post("/auth/login", body);

        return { data: response.data as LoginResponse, status: response.status };
    } catch (error) {
        return { error };
    }
}
