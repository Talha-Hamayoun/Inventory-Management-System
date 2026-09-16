import apiClient from "../client";

export async function updateSalesOrderStatus(id: string, status: "CONFIRMED" | "FULFILLED" | "CANCELLED") {
  try {
    const response = await apiClient.post(`/sales-orders/${id}/status`, { status });
    return { data: response.data as { success: boolean; message: string }, status: response.status };
  } catch (error) {
    return { error };
  }
}
