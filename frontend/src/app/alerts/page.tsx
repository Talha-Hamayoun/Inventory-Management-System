"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Loading } from "@/src/components/ui/loading";
import { Pagination } from "@/src/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import type { StockAlert } from "@/src/lib/api/alerts/types";
import { alertsApi } from "@/src/lib/api";
import { formatDateTime } from "@/src/lib/utils";
import { Bell, BellOff, CheckCircle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const selectClass =
  "flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent";

export default function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchAlerts = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await alertsApi.list({ page, limit: 20 });
      if (!response.data || response.error) {
        console.error("Failed to fetch alerts:", response.error);
      } else if (!response.data.success) {
        console.error("Failed to fetch alerts:", response.data);
      } else {
        setAlerts(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleToggle = async (alert: StockAlert): Promise<void> => {
    const newIsActive = !alert.isActive;
    setUpdating(alert.id);
    try {
      const response = await alertsApi.update(alert.id, { isActive: newIsActive });
      if (!response.data || response.error) {
        toast.error("Failed to update alert");
      } else if (!response.data.success) {
        toast.error(response.data.message || "Failed to update alert");
      } else {
        toast.success(newIsActive ? "Alert activated" : "Alert deactivated");
        fetchAlerts();
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    setUpdating(id);
    try {
      const response = await alertsApi.delete(id);
      if (!response.data || response.error) {
        toast.error("Failed to delete alert");
      } else if (!response.data.success) {
        toast.error(response.data.message || "Failed to delete alert");
      } else {
        toast.success("Alert rule deleted");
        fetchAlerts();
      }
    } finally {
      setUpdating(null);
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === "LOW_STOCK") return <Badge variant="warning">Low Stock</Badge>;
    if (type === "OUT_OF_STOCK") return <Badge variant="error">Out of Stock</Badge>;
    return <Badge>{type}</Badge>;
  };

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter === "active") return a.isActive;
    if (statusFilter === "inactive") return !a.isActive;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Alerts</h1>
            <p className="text-gray-600">Manage alert rules for low and out-of-stock conditions</p>
          </div>
          <Link href="/alerts/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Alert
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "" | "active" | "inactive");
                  setPage(1);
                }}
                className={selectClass + " w-40"}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No alert rules found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead className="text-right">Threshold</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>{getTypeBadge(alert.alertType)}</TableCell>
                        <TableCell className="font-medium">{alert.product.name}</TableCell>
                        <TableCell className="text-gray-500">
                          {alert.product.sku ?? "—"}
                        </TableCell>
                        <TableCell className="text-gray-600">{alert.warehouse.name}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {alert.alertType === "OUT_OF_STOCK" ? "—" : alert.threshold}
                        </TableCell>
                        <TableCell>
                          {alert.isActive ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1">
                              <BellOff className="h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {formatDateTime(alert.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggle(alert)}
                              disabled={updating === alert.id}
                              className="gap-1"
                            >
                              {updating === alert.id ? (
                                <Loading size="sm" />
                              ) : alert.isActive ? (
                                <>
                                  <BellOff className="h-3 w-3" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Bell className="h-3 w-3" />
                                  Activate
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(alert.id)}
                              disabled={updating === alert.id}
                              className="gap-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
