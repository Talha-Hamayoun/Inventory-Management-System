"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { Modal } from "@/src/components/ui/modal";
import { Pagination } from "@/src/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { salesOrdersApi } from "@/src/lib/api";
import type { PaymentStatus, SalesOrder, SalesOrderStatus } from "@/src/lib/api/sales-orders/types";
import { toast } from "sonner";
import { Eye, Plus, Printer, Search, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const STATUS_COLORS: Record<SalesOrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  FULFILLED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  UNPAID: "bg-red-100 text-red-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
};

export default function SalesOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<SalesOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await salesOrdersApi.list({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      if (response.data?.success) {
        setOrders(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const confirmDelete = (order: SalesOrder) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      const response = await salesOrdersApi.delete(orderToDelete.id);
      if (response.data?.success) {
        toast.success("Order deleted");
        setShowDeleteModal(false);
        fetchOrders();
      } else {
        toast.error(response.data?.message || "Failed to delete order");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
            <p className="text-gray-600">Manage customer sales orders</p>
          </div>
          <Link href="/sales-orders/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by order number or customer..."
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as SalesOrderStatus | ""); setPage(1); }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="FULFILLED">Fulfilled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <Button type="submit" variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No sales orders found</p>
                <p className="text-sm mt-1">{search || statusFilter ? "Try adjusting your filters" : "Create your first sales order"}</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div className="font-medium">{order.customer.name}</div>
                          <div className="text-xs text-gray-500">{order.customer.phone}</div>
                        </TableCell>
                        <TableCell>{order.warehouse.name}</TableCell>
                        <TableCell>{order.itemCount ?? 0}</TableCell>
                        <TableCell className="font-medium">Rs. {Number(order.totalAmount).toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PAYMENT_STATUS_COLORS[order.paymentStatus]}`}>
                            {order.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/sales-orders/${order.id}`}>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                            </Link>
                            <Link href={`/sales-orders/${order.id}/invoice`}>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Printer className="h-3 w-3" />
                                Invoice
                              </Button>
                            </Link>
                            {order.status === "PENDING" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => confirmDelete(order)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
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

        {/* Delete Confirm Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Order"
        >
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete order <strong>{orderToDelete?.orderNumber}</strong>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loading size="sm" /> : "Delete"}
            </Button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
