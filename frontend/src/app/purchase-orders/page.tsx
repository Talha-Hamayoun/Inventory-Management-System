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
import type { PurchaseOrder, PurchaseOrderStatus } from "@/src/lib/api/purchase-orders/types";
import { purchaseOrdersApi } from "@/src/lib/api";
import { toast } from "sonner";
import { formatCurrency, formatDateTime } from "@/src/lib/utils";
import { Eye, Plus, Search, XCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const selectClass =
  "flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent";

export default function PurchaseOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PurchaseOrderStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<PurchaseOrder | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrders = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await purchaseOrdersApi.list({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
      });
      if (!response.data || response.error) {
        console.error("Failed to fetch purchase orders:", response.error);
      } else if (response.data.success === false) {
        console.error("Failed to fetch purchase orders:", response.data);
      } else {
        setOrders(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleCancelClick = (order: PurchaseOrder) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async (): Promise<void> => {
    if (!orderToCancel) return;
    setCancelling(true);
    try {
      const response = await purchaseOrdersApi.cancel(orderToCancel.id);
      if (!response.data || response.error) {
        toast.error("Failed to cancel order");
      } else if (response.data.success === false) {
        toast.error(response.data.message || "Failed to cancel order");
      } else {
        toast.success("Order cancelled");
        setShowCancelModal(false);
        setOrderToCancel(null);
        fetchOrders();
      }
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (orderStatus: PurchaseOrderStatus) => {
    const variants: Record<PurchaseOrderStatus, "default" | "warning" | "success" | "error" | "info"> = {
      DRAFT: "default",
      ORDERED: "info",
      PARTIALLY_RECEIVED: "warning",
      COMPLETED: "success",
      CANCELLED: "error",
    };
    return (
      <Badge variant={variants[orderStatus] || "default"}>
        {orderStatus.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600">Manage supplier purchase orders</p>
          </div>
          <Link href="/purchase-orders/new" className="cursor-pointer">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
              <div className="flex flex-1 gap-2 min-w-50">
                <Input
                  placeholder="Search by supplier name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="outline" className="gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as PurchaseOrderStatus | "");
                  setPage(1);
                }}
                className={selectClass}
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="ORDERED">Ordered</option>
                <option value="PARTIALLY_RECEIVED">Partially Received</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </form>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No purchase orders found. Create your first order to get started.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium font-mono text-sm">{order.poNumber}</TableCell>
                        <TableCell>{order.supplier?.name || "-"}</TableCell>
                        <TableCell>{order.warehouse?.name || "-"}</TableCell>
                        <TableCell className="text-right">{order._count?.items ?? 0}</TableCell>
                        <TableCell className="text-right">{formatCurrency(order.totalCost)}</TableCell>
                        <TableCell>
                          {order.expectedDeliveryDate
                            ? formatDateTime(order.expectedDeliveryDate)
                            : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-gray-500">
                          {formatDateTime(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Link href={`/purchase-orders/${order.id}`}>
                              <Button variant="ghost" size="sm" title="View details">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {["DRAFT", "ORDERED"].includes(order.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Cancel order"
                                onClick={() => handleCancelClick(order)}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4">
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => { setShowCancelModal(false); setOrderToCancel(null); }}
      >
        <ModalHeader>
          <ModalTitle>Cancel Purchase Order</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="text-gray-600">
            Are you sure you want to cancel the order from{" "}
            <span className="font-semibold text-gray-900">
              {orderToCancel?.supplier?.name || "this supplier"}
            </span>?
          </p>
          <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
        </ModalContent>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => { setShowCancelModal(false); setOrderToCancel(null); }}
            disabled={cancelling}
          >
            Keep Order
          </Button>
          <Button variant="destructive" onClick={handleCancelConfirm} disabled={cancelling}>
            {cancelling ? <Loading size="sm" /> : "Cancel Order"}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
