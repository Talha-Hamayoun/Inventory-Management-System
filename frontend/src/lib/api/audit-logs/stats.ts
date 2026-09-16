import apiClient from "../client";

export async function getAuditStats() {
  try {
    const response = await apiClient.get("/audit-logs/stats/summary");
    return { data: response.data, status: response.status };
  } catch (error) {
    return { error };
  }
}
