"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading, PageLoading } from "@/src/components/ui/loading";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/src/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { purchaseOrdersApi } from "@/src/lib/api";
import type { PurchaseOrderDetail } from "@/src/lib/api/purchase-orders/types";
import { toast } from "sonner";
import { formatCurrency, formatDateTime } from "@/src/lib/utils";
import { ArrowLeft, CheckCircle, Package, Truck, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { JSX, useCallback, useEffect, useState } from "react";

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<PurchaseOrderDetail | null>(null);

  // Receive modal
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivingItems, setReceivingItems] = useState<Record<string, number>>({});
  const [receiving, setReceiving] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Mark as Ordered
  const [markingOrdered, setMarkingOrdered] = useState(false);

  const fetchOrder = useCallback(async (): Promise<void> => {
    try {
      const response = await purchaseOrdersApi.get(params.id as string);
      if (!response.data || response.error) {
        toast.error("Failed to fetch purchase order");
      } else if (!response.data.success) {
        toast.error(response.data.message || "Failed to fetch purchase order");
      } else {
        setOrder(response.data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // --- Receive ---
  const handleOpenReceive = (): void => {
    if (!order) return;
    const initial: Record<string, number> = {};
    order.items
      .filter((item) => item.receivedQuantity < item.orderedQuantity)
      .forEach((item) => {
        initial[item.id] = 0;
      });
    setReceivingItems(initial);
    setShowReceiveModal(true);
  };

  const handleReceiveAll = (): void => {
    if (!order) return;
    const all: Record<string, number> = {};
    order.items
      .filter((item) => item.receivedQuantity < item.orderedQuantity)
      .forEach((item) => {
        all[item.id] = item.orderedQuantity - item.receivedQuantity;
      });
    setReceivingItems(all);
  };

  const handleCloseReceive = (): void => {
    setShowReceiveModal(false);
    setReceivingItems({});
  };

  const handleReceive = async (): Promise<void> => {
    if (!order) return;

    const items = Object.entries(receivingItems)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, receivedQuantity]) => ({ itemId, receivedQuantity }));

    if (items.length === 0) {
      toast.error("Please enter quantities to receive");
      return;
    }

    setReceiving(true);
    try {
      const response = await purchaseOrdersApi.receive(order.id, items);
      if (!response.data || response.error) {
        toast.error("Failed to receive items");
      } else if (!response.data.success) {
        toast.error(response.data.message || "Failed to receive items");
      } else {
        toast.success("Items received successfully");
        handleCloseReceive();
        fetchOrder();
      }
    } finally {
      setReceiving(false);
    }
  };

  // --- Mark as Ordered ---
  const handleMarkOrdered = async (): Promise<void> => {
    if (!order) return;
    setMarkingOrdered(true);
    try {
      const response = await purchaseOrdersApi.update(order.id, { status: "ORDERED" });
      if (!response.data || response.error) {
        toast.error("Failed to update order status");
      } else if (!response.data.success) {
        toast.error(response.data.message || "Failed to update order status");
      } else {
        toast.success("Order marked as ordered");
        fetchOrder();
      }
    } finally {
      setMarkingOrdered(false);
    }
  };

  // --- Cancel ---
  const handleCancel = async (): Promise<void> => {
    if (!order) return;
    setCancelling(true);
    try {
      const response = await purchaseOrdersApi.cancel(order.id);
      if (!response.data || response.error) {
        toast.error("Failed to cancel order");
      } else if (!response.data.success) {
        toast.error(response.data.message || "Failed to cancel order");
      } else {
        toast.success("Order cancelled successfully");
        setShowCancelModal(false);
        fetchOrder();
      }
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading />
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Purchase order not found</p>
          <Link href="/purchase-orders" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to Purchase Orders
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string): JSX.Element => {
    const variants: Record<string, "default" | "warning" | "success" | "error" | "info"> = {
      DRAFT: "default",
      ORDERED: "info",
      PARTIALLY_RECEIVED: "warning",
      COMPLETED: "success",
      CANCELLED: "error",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const canReceive = ["DRAFT", "ORDERED", "PARTIALLY_RECEIVED"].includes(order.status);
  const canMarkOrdered = order.status === "DRAFT";
  const canCancel = ["DRAFT", "ORDERED"].includes(order.status);

  const pendingItems = order.items.filter(
    (item) => item.receivedQuantity < item.orderedQuantity
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/purchase-orders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  Purchase Order
                </h1>
                {getStatusBadge(order.status)}
              </div>
              <p className="text-sm text-gray-500">
                Created {formatDateTime(order.createdAt)}
                {order.createdByUser && ` by ${order.createdByUser.name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canMarkOrdered && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleMarkOrdered}
                disabled={markingOrdered}
              >
                {markingOrdered ? <Loading size="sm" /> : <Package className="h-4 w-4" />}
                Mark as Ordered
              </Button>
            )}
            {canReceive && (
              <Button className="gap-2" onClick={handleOpenReceive}>
                <Truck className="h-4 w-4" />
                Receive Items
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setShowCancelModal(true)}
              >
                <XCircle className="h-4 w-4" />
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Supplier</p>
              <p className="font-semibold text-lg">
                {order.supplier ? order.supplier.name : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Destination Warehouse</p>
              <p className="font-semibold text-lg">
                {order.warehouse ? order.warehouse.name : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="font-semibold text-2xl text-blue-600">
                {formatCurrency(Number(order.totalCost))}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dates */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-8">
              <div>
                <p className="text-sm text-gray-500">Expected Delivery</p>
                <p className="font-medium">
                  {order.expectedDeliveryDate
                    ? formatDateTime(order.expectedDeliveryDate)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{formatDateTime(order.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items ({order.items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Ordered</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product.name}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {item.product.sku ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.orderedQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.receivedQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(item.unitCost))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(item.unitCost) * item.orderedQuantity)}
                    </TableCell>
                    <TableCell>
                      {item.receivedQuantity >= item.orderedQuantity ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Complete
                        </Badge>
                      ) : item.receivedQuantity > 0 ? (
                        <Badge variant="warning">Partial</Badge>
                      ) : (
                        <Badge variant="default">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Receive Items Modal */}
      <Modal isOpen={showReceiveModal} onClose={handleCloseReceive}>
        <ModalHeader>
          <ModalTitle>Receive Items</ModalTitle>
        </ModalHeader>
        <ModalContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Enter the quantities received. Inventory will be updated automatically.
            </p>
            <Button variant="outline" size="sm" onClick={handleReceiveAll}>
              Receive All Remaining
            </Button>
          </div>
          {pendingItems.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              All items have been fully received.
            </p>
          ) : (
            pendingItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-500">
                    SKU: {item.product.sku ?? "—"} &bull; Remaining:{" "}
                    {item.orderedQuantity - item.receivedQuantity}
                  </p>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    min="0"
                    max={item.orderedQuantity - item.receivedQuantity}
                    value={receivingItems[item.id] ?? 0}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setReceivingItems((prev) => ({
                        ...prev,
                        [item.id]: Math.min(
                          parseInt(e.target.value, 10) || 0,
                          item.orderedQuantity - item.receivedQuantity
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            ))
          )}
        </ModalContent>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleCloseReceive}>
            Cancel
          </Button>
          <Button onClick={handleReceive} disabled={receiving || pendingItems.length === 0}>
            {receiving ? <Loading size="sm" /> : "Confirm Receive"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)}>
        <ModalHeader>
          <ModalTitle>Cancel Purchase Order</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="text-gray-600">
            Are you sure you want to cancel this purchase order? This action cannot be undone.
          </p>
        </ModalContent>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCancelModal(false)}
            disabled={cancelling}
          >
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? <Loading size="sm" /> : "Cancel Order"}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
