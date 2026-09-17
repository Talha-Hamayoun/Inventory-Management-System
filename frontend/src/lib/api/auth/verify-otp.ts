import type { ApiResponse } from "@/src/types/ApiResponse";
import apiClient from "../client";

type VerifyOtpResponse = ApiResponse<{ message: string }>;

export async function verifyOtp(body: { email: string; otp: string }) {
    try {
        const response = await apiClient.post("/auth/verify-otp", body);
        return { data: response.data as VerifyOtpResponse, status: response.status };
    } catch (error) {
        return { error };
    }
}
