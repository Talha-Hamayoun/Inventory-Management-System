import apiClient from "../client";

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  user?: { id: string; name: string; email: string } | null;
  createdAt: string;
}

export async function listAuditLogs(params?: {
  page?: number;
  limit?: number;
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: "CREATE" | "UPDATE" | "DELETE";
  startDate?: string;
  endDate?: string;
}) {
  try {
    const response = await apiClient.get("/audit-logs", { params });
    return { data: response.data, status: response.status };
  } catch (error) {
    return { error };
  }
}
