"use client";

import { DashboardLayout } from "@/src/components/dashboard-layout";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Loading } from "@/src/components/ui/loading";
import { Modal } from "@/src/components/ui/modal";
import { returnsApi } from "@/src/lib/api";
import type { ReturnOrder, ReturnStatus, ReturnType } from "@/src/lib/api/returns/types";
import { AlertTriangle, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

export default function ReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [returnOrder, setReturnOrder] = useState<ReturnOrder | null>(null);
  const [acting, setActing] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    returnsApi.get(id).then((r) => {
      if (r.data?.success) setReturnOrder(r.data.data);
      else toast.error(r.data?.message || "Return not found");
      setLoading(false);
    });
  }, [id]);

  const handleProcess = async () => {
    setShowProcessModal(false);
    setActing(true);
    try {
      const r = await returnsApi.process(id);
      if (r.data?.success) {
        toast.success("Return processed — stock updated");
        setReturnOrder(r.data.data);
      } else {
        toast.error(r.data?.message || "Failed to process return");
      }
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    setShowCancelModal(false);
    setActing(true);
    try {
      const r = await returnsApi.cancel(id);
      if (r.data?.success) {
        toast.success("Return cancelled");
        setReturnOrder(r.data.data);
      } else {
        toast.error(r.data?.message || "Failed to cancel return");
      }
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16"><Loading size="lg" /></div>
      </DashboardLayout>
    );
  }

  if (!returnOrder) {
    return (
      <DashboardLayout>
        <div className="text-center py-16 text-gray-500">Return not found.</div>
      </DashboardLayout>
    );
  }

  const totalQty = returnOrder.items.reduce((s, i) => s + i.quantity, 0);
  const totalValue = returnOrder.items.reduce((s, i) => s + i.quantity * Number(i.unitPrice), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Process Confirmation Modal */}
        <Modal isOpen={showProcessModal} onClose={() => setShowProcessModal(false)} size="sm">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Process Return</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to process <span className="font-medium">{returnOrder.returnNumber}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Stock will be updated immediately and this action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => setShowProcessModal(false)} disabled={acting}>
                Cancel
              </Button>
              <Button
                onClick={handleProcess}
                disabled={acting}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                {acting ? <Loading size="sm" /> : <><CheckCircle className="h-4 w-4" /> Yes, Process</>}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Cancel Confirmation Modal */}
        <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} size="sm">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cancel Return</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to cancel <span className="font-medium">{returnOrder.returnNumber}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                No stock changes will be made. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => setShowCancelModal(false)} disabled={acting}>
                Keep Return
              </Button>
              <Button
                onClick={handleCancel}
                disabled={acting}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 gap-2"
              >
                {acting ? <Loading size="sm" /> : <><XCircle className="h-4 w-4" /> Yes, Cancel</>}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/returns">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{returnOrder.returnNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <ReturnTypeBadge type={returnOrder.returnType} />
              <StatusBadge status={returnOrder.status} />
            </div>
          </div>
          {returnOrder.status === "PENDING" && (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowProcessModal(true)}
                disabled={acting}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" /> Process
              </Button>
              <Button
                onClick={() => setShowCancelModal(true)}
                disabled={acting}
                variant="outline"
                className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" /> Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Info */}
        <Card>
          <CardHeader><CardTitle>Return Information</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Return Type</p>
                <p className="font-medium">
                  {returnOrder.returnType === "SALES_RETURN" ? "Sales Return" : "Purchase Return"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Status</p>
                <StatusBadge status={returnOrder.status} />
              </div>
              <div>
                <p className="text-gray-500 mb-1">Warehouse</p>
                <p className="font-medium">{returnOrder.warehouse.name}</p>
              </div>
              {returnOrder.salesOrder && (
                <div>
                  <p className="text-gray-500 mb-1">Sales Order</p>
                  <Link href={`/sales-orders/${returnOrder.salesOrderId}`} className="text-blue-600 hover:underline font-medium">
                    {returnOrder.salesOrder.orderNumber}
                  </Link>
                </div>
              )}
              {returnOrder.supplier && (
                <div>
                  <p className="text-gray-500 mb-1">Supplier</p>
                  <p className="font-medium">{returnOrder.supplier.name}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500 mb-1">Processed By</p>
                <p className="font-medium">{returnOrder.processedByUser.name}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Created</p>
                <p className="font-medium">{new Date(returnOrder.createdAt).toLocaleString()}</p>
              </div>
              {returnOrder.notes && (
                <div className="col-span-2 md:col-span-3">
                  <p className="text-gray-500 mb-1">Notes</p>
                  <p className="font-medium">{returnOrder.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader><CardTitle>Return Items ({returnOrder.items.length})</CardTitle></CardHeader>
          <CardContent>
            <table className="min-w-full border rounded-lg overflow-hidden text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">#</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Product</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Qty</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Condition</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Unit Price</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Unit Cost</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {returnOrder.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium">
                      {item.product.name}
                      {item.product.sku && <span className="ml-1 text-xs text-gray-400">({item.product.sku})</span>}
                    </td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.condition === "RESTOCKABLE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {item.condition === "RESTOCKABLE" ? "Restockable" : "Damaged"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">Rs. {Number(item.unitPrice).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">
                      {item.unitCost != null ? `Rs. ${Number(item.unitCost).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      Rs. {(item.quantity * Number(item.unitPrice)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end pt-4 border-t mt-4">
              <div className="text-right space-y-1">
                <p className="text-sm text-gray-500">Total Qty: <span className="font-medium text-gray-900">{totalQty}</span></p>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">Rs. {totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {returnOrder.status === "PENDING" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            <strong>Pending:</strong> This return has not been processed yet. Stock will only change after you click "Process".
          </div>
        )}
        {returnOrder.status === "PROCESSED" && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <strong>Processed:</strong> Stock has been updated for all items in this return.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
