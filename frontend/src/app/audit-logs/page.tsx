"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/src/components/ui/modal";
import { Pagination } from "@/src/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { auditLogsApi } from "@/src/lib/api";
import { formatDateTime } from "@/src/lib/utils";
import { Eye, History, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface AuditLog {
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

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState<"CREATE" | "UPDATE" | "DELETE" | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await auditLogsApi.list({
        page,
        limit: 20,
        entityType: entityType || undefined,
        action: action || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (!response.data || response.error) {
        console.error("Failed to fetch audit logs:", response.error);
      } else if (response.data.success === false) {
        console.error("Failed to fetch audit logs:", response.data);
      } else {
        setLogs(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, entityType, action, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadge = (actionType: string) => {
    const variants: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
      CREATE: "success",
      UPDATE: "warning",
      DELETE: "error",
      LOGIN: "info",
      LOGOUT: "default",
    };
    return <Badge variant={variants[actionType] || "default"}>{actionType}</Badge>;
  };

  const ENTITY_TYPES = [
    "Product",
    "Category",
    "Warehouse",
    "Supplier",
    "InventoryItem",
    "InventoryMovement",
    "PurchaseOrder",
    "StockReservation",
    "ReturnOrder",
    "StockAlert",
    "Customer",
    "SalesOrder",
    "User",
    "Role",
  ];

  const ACTIONS = ["CREATE", "UPDATE", "DELETE"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600">Track all system activities</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <select
                  value={entityType}
                  onChange={(e) => {
                    setEntityType(e.target.value);
                    setPage(1);
                  }}
                  className="w-48"
                >
                  <option value="">All Entity Types</option>
                  {ENTITY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  value={action}
                  onChange={(e) => {
                    setAction(e.target.value as "CREATE" | "UPDATE" | "DELETE" | "");
                    setPage(1);
                  }}
                  className="w-40"
                >
                  <option value="">All Actions</option>
                  {ACTIONS.map((act) => (
                    <option key={act} value={act}>
                      {act}
                    </option>
                  ))}
                </select>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                  placeholder="Start Date"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                  placeholder="End Date"
                />
                <Button type="submit" variant="outline" className="gap-2">
                  <Search className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No audit logs found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-gray-500">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          {log.user ? (
                            <div>
                              <p className="font-medium">{log.user.name}</p>
                              <p className="text-sm text-gray-500">{log.user.email}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">System</span>
                          )}
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <Badge variant="default">{log.entityType}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 font-mono text-sm">
                          {log.entityId.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {log.ipAddress || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Log Details Modal */}
      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)}>
        <ModalHeader>
          <ModalTitle>Audit Log Details</ModalTitle>
        </ModalHeader>
        <ModalContent className="space-y-4">
          {selectedLog && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Timestamp</p>
                  <p className="font-medium">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Action</p>
                  <div>{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entity Type</p>
                  <p className="font-medium">{selectedLog.entityType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entity ID</p>
                  <p className="font-medium font-mono text-sm">{selectedLog.entityId}</p>
                </div>
              </div>

              {selectedLog.user && (
                <div>
                  <p className="text-sm text-gray-500">User</p>
                  <p className="font-medium">
                    {selectedLog.user.name} ({selectedLog.user.email})
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">IP Address</p>
                  <p className="font-medium">{selectedLog.ipAddress || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">User Agent</p>
                  <p className="font-medium text-sm truncate">
                    {selectedLog.userAgent || "-"}
                  </p>
                </div>
              </div>

              {selectedLog.oldValues && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Old Values</p>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-40">
                    <pre className="text-sm text-gray-700">{JSON.stringify(selectedLog.oldValues, null, 2)}</pre>
                  </div>
                </div>
              )}
              {selectedLog.newValues && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">New Values</p>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-40">
                    <pre className="text-sm text-gray-700">{JSON.stringify(selectedLog.newValues, null, 2)}</pre>
                  </div>
                </div>
              )}
            </>
          )}
        </ModalContent>
        <ModalFooter>
          <Button onClick={() => setSelectedLog(null)}>Close</Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
