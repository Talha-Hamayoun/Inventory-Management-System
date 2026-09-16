import { prisma } from "../lib/prisma";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export interface AuditLogInput {
  userId: number;
  action: AuditAction;
  entityType: string;
  entityId: number;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  transaction?: Pick<typeof prisma, "auditLog">;
}

export async function createAuditLog(input: AuditLogInput) {
  const client = input.transaction ?? prisma;

  return client.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValues: JSON.stringify(input.oldValues),
      newValues: JSON.stringify(input.newValues),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
