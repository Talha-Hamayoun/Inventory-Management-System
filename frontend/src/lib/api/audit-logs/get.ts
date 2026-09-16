import apiClient from "../client";

export async function getAuditLog(id: string) {
  try {
    const response = await apiClient.get(`/audit-logs/${id}`);
    return { data: response.data, status: response.status };
  } catch (error) {
    return { error };
  }
}
