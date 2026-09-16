"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { Card, CardContent } from "@/src/components/ui/card";
import { Loading } from "@/src/components/ui/loading";
import { Pagination } from "@/src/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import type { ReturnOrder, ReturnStatus, ReturnType } from "@/src/lib/api/returns/types";
import { returnsApi } from "@/src/lib/api";
import { Plus, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";


function ReturnTypeBadge({ type }: { type: ReturnType }) {
  return (
    <Badge variant={type === "SALES_RETURN" ? "info" : "default"}>
      {type === "SALES_RETURN" ? "Sales Return" : "Purchase Return"}
    </Badge>
  );
}

function StatusBadge({ status }: { status: ReturnStatus }) {
  const variantMap: Record<ReturnStatus, "warning" | "success" | "error"> = {
    PENDING: "warning",
    PROCESSED: "success",
    CANCELLED: "error",
  };
  const labelMap: Record<ReturnStatus, string> = {
    PENDING: "Pending",
    PROCESSED: "Processed",
    CANCELLED: "Cancelled",
  };
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}

export default function ReturnsPage() {
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [returnType, setReturnType] = useState<ReturnType | "">("");
  const [status, setStatus] = useState<ReturnStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await returnsApi.list({
        page,
        limit: 10,
        returnType: returnType || undefined,
        status: status || undefined,
      });
      if (response.data?.success) {
        setReturns(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, returnType, status]);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Returns</h1>
            <p className="text-gray-600">Manage sales and purchase order returns</p>
          </div>
          <Link href="/returns/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Return
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <Select
                value={returnType}
                onChange={(e) => { setReturnType(e.target.value as ReturnType | ""); setPage(1); }}
                className="w-48"
              >
                <option value="">All Types</option>
                <option value="SALES_RETURN">Sales Return</option>
                <option value="PURCHASE_RETURN">Purchase Return</option>
              </Select>
              <Select
                value={status}
                onChange={(e) => { setStatus(e.target.value as ReturnStatus | ""); setPage(1); }}
                className="w-40"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSED">Processed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8"><Loading size="lg" /></div>
            ) : returns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <RotateCcw className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No returns found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Return #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returns.map((ret) => (
                      <TableRow key={ret.id}>
                        <TableCell className="font-medium">{ret.returnNumber}</TableCell>
                        <TableCell><ReturnTypeBadge type={ret.returnType} /></TableCell>
                        <TableCell><StatusBadge status={ret.status} /></TableCell>
                        <TableCell className="text-gray-600 font-mono text-sm">
                          {ret.salesOrder
                            ? ret.salesOrder.orderNumber
                            : ret.purchaseOrder
                            ? ret.purchaseOrder.poNumber
                            : "—"}
                        </TableCell>
                        <TableCell className="text-gray-600">{ret.warehouse.name}</TableCell>
                        <TableCell className="text-right">{ret.items.length}</TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {new Date(ret.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Link href={`/returns/${ret.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
