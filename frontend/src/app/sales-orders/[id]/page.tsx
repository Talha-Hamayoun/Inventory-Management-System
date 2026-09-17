"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Button } from "@/src/components/ui/button";
import { Select } from "@/src/components/ui/select";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Loading } from "@/src/components/ui/loading";
import { Modal } from "@/src/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { salesOrdersApi } from "@/src/lib/api";
import type { PaymentMethod, PaymentStatus, SalesOrder, SalesOrderStatus } from "@/src/lib/api/sales-orders/types";
import { PAYMENT_METHOD_LABELS } from "@/src/lib/api/sales-orders/types";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, CreditCard, Package, Printer, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function SalesOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const [confirmModal, setConfirmModal] = useState<{ action: "CONFIRMED" | "FULFILLED" | "CANCELLED" } | null>(null);
  const [actioning, setActioning] = useState(false);

  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paymentActioning, setPaymentActioning] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await salesOrdersApi.get(id);
      if (response.data?.success) setOrder(response.data.data);
      else toast.error(response.data?.message || "Order not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleStatusChange = async () => {
    if (!confirmModal || !order) return;
    setActioning(true);
    try {
      const response = await salesOrdersApi.updateStatus(order.id, confirmModal.action);
      if (response.data?.success) {
        toast.success(response.data.message);
        setConfirmModal(null);
        fetchOrder();
      } else {
        toast.error(response.data?.message || "Failed to update status");
      }
    } finally {
      setActioning(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!order) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setPaymentActioning(true);
    try {
      const response = await salesOrdersApi.updatePayment(order.id, {
        amountPaid: amount,
        paymentMethod: paymentMethod || undefined,
      });
      if (response.data?.success) {
        toast.success("Payment recorded");
        setPaymentModal(false);
        fetchOrder();
      } else {
        toast.error(response.data?.message || "Failed to record payment");
      }
    } finally {
      setPaymentActioning(false);
    }
  };

  const openPaymentModal = () => {
    if (!order) return;
    setPaymentAmount(order.amountPaid ?? "0");
    setPaymentMethod(order.paymentMethod ?? "");
    setPaymentModal(true);
  };

  const handleDelete = async () => {
    if (!order) return;
    const response = await salesOrdersApi.delete(order.id);
    if (response.data?.success) {
      toast.success("Order deleted");
      router.push("/sales-orders");
    } else {
      toast.error(response.data?.message || "Failed to delete order");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16"><Loading size="lg" /></div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-16 text-gray-500">Order not found.</div>
      </DashboardLayout>
    );
  }

  const actionLabel: Record<string, string> = {
    CONFIRMED: "Confirm Order",
    FULFILLED: "Mark as Fulfilled",
    CANCELLED: "Cancel Order",
  };

  const actionDesc: Record<string, string> = {
    CONFIRMED: "This will confirm the order and mark it as ready to fulfill.",
    FULFILLED: "This will mark the order as fulfilled and deduct stock from inventory.",
    CANCELLED: "This will cancel the order. This action cannot be undone.",
  };

  const totalAmount = Number(order.totalAmount);
  const amountPaid = Number(order.amountPaid);
  const balanceDue = totalAmount - amountPaid;
  const itemsSubtotal = order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const discountAmount = Number(order.discountAmount ?? 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link href="/sales-orders">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[order.paymentStatus]}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap justify-end">
            <Link href={`/sales-orders/${order.id}/invoice`}>
              <Button variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Print Invoice
              </Button>
            </Link>
            {order.status !== "CANCELLED" && (
              <Button variant="outline" onClick={openPaymentModal} className="gap-2">
                <CreditCard className="h-4 w-4" />
                Record Payment
              </Button>
            )}
            {order.status === "PENDING" && (
              <>
                <Link href={`/sales-orders/${order.id}/edit`}>
                  <Button variant="outline">Edit Order</Button>
                </Link>
                <Button onClick={() => setConfirmModal({ action: "CONFIRMED" })} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <CheckCircle className="h-4 w-4" />
                  Confirm
                </Button>
                <Button variant="outline" onClick={() => setConfirmModal({ action: "CANCELLED" })} className="text-red-600 border-red-300 hover:bg-red-50">
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            )}
            {order.status === "CONFIRMED" && (
              <>
                <Button onClick={() => setConfirmModal({ action: "FULFILLED" })} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Package className="h-4 w-4" />
                  Fulfill
                </Button>
                <Button variant="outline" onClick={() => setConfirmModal({ action: "CANCELLED" })} className="text-red-600 border-red-300 hover:bg-red-50">
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold text-gray-900 mb-3">Customer</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium">{order.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-mono">{order.customer.phone}</span>
                </div>
                {order.customer.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span>{order.customer.email}</span>
                  </div>
                )}
                {order.customer.address && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Address</span>
                    <span className="text-right max-w-48">{order.customer.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold text-gray-900 mb-3">Order Info</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Warehouse</span>
                  <span className="font-medium">{order.warehouse.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created By</span>
                  <span>{order.createdByUser?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created At</span>
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                {order.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Notes</span>
                    <span className="text-right max-w-48">{order.notes}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Payment</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[order.paymentStatus]}`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Invoice Total</p>
                <p className="text-lg font-semibold text-gray-900">Rs. {totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Amount Paid</p>
                <p className="text-lg font-semibold text-green-700">Rs. {amountPaid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Balance Due</p>
                <p className={`text-lg font-semibold ${balanceDue > 0 ? "text-red-700" : "text-gray-400"}`}>
                  Rs. {balanceDue.toLocaleString()}
                </p>
              </div>
            </div>
            {order.paymentMethod && (
              <p className="text-sm text-gray-500 mt-3">
                Payment Method: <span className="font-medium text-gray-700">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold text-gray-900 mb-4">Order Items</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell className="font-mono text-sm text-gray-500">{item.product.sku || "—"}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">Rs. {Number(item.unitPrice).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">Rs. {Number(item.totalPrice).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t mt-4 pt-4 flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">Rs. {itemsSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount / Savings</span>
                  <span className="font-medium text-green-700">
                    Rs. {discountAmount.toLocaleString()}
                    {order.discountType === "PERCENTAGE" && Number(order.discountValue) > 0
                      ? ` (${Number(order.discountValue)}%)`
                      : ""}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-gray-700 font-semibold">Invoice Total</span>
                  <span className="text-2xl font-bold text-gray-900">Rs. {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {order.status === "PENDING" && (
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <h2 className="font-semibold text-red-700 mb-2">Danger Zone</h2>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Permanently delete this order. Only PENDING orders can be deleted.</p>
                <Button variant="destructive" onClick={handleDelete}>Delete Order</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Action Modal */}
        <Modal
          isOpen={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          title={confirmModal ? actionLabel[confirmModal.action] : ""}
        >
          <p className="text-gray-600 mb-6">{confirmModal ? actionDesc[confirmModal.action] : ""}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button
              onClick={handleStatusChange}
              disabled={actioning}
              className={confirmModal?.action === "CANCELLED" ? "bg-red-600 hover:bg-red-700" : confirmModal?.action === "FULFILLED" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {actioning ? <Loading size="sm" /> : confirmModal ? actionLabel[confirmModal.action] : ""}
            </Button>
          </div>
        </Modal>

        {/* Record Payment Modal */}
        <Modal
          isOpen={paymentModal}
          onClose={() => setPaymentModal(false)}
          title="Record Payment"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm flex justify-between">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-semibold">Rs. {totalAmount.toLocaleString()}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Paid <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min={0}
                max={totalAmount}
                step={0.01}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-400 mt-1">Enter total amount paid so far (cumulative)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")}
                className="w-full"
              >
                <option value="">— Select method —</option>
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((key) => (
                  <option key={key} value={key}>{PAYMENT_METHOD_LABELS[key]}</option>
                ))}
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPaymentModal(false)}>Cancel</Button>
              <Button onClick={handleRecordPayment} disabled={paymentActioning}>
                {paymentActioning ? <Loading size="sm" /> : "Save Payment"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
