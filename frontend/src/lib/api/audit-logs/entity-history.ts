import apiClient from "../client";

export async function getEntityHistory(entityType: string, entityId: string) {
  try {
    const response = await apiClient.get(`/audit-logs/entity/${entityType}/${entityId}`);
    return { data: response.data, status: response.status };
  } catch (error) {
    return { error };
  }
}
