import type { ApiResponse } from "@/src/types/ApiResponse";
import apiClient from "../client";

type ResendOtpResponse = ApiResponse<{ message: string; retryAfter?: number }>;

export async function resendOtp(body: { email: string }) {
    try {
        const response = await apiClient.post("/auth/resend-otp", body);
        return { data: response.data as ResendOtpResponse, status: response.status };
    } catch (error) {
        return { error };
    }
}
