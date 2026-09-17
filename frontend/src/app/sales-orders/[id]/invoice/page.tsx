"use client";

import { salesOrdersApi, settingsApi } from "@/src/lib/api";
import type { SalesOrder } from "@/src/lib/api/sales-orders/types";
import { PAYMENT_METHOD_LABELS } from "@/src/lib/api/sales-orders/types";
import type { CompanySettings } from "@/src/lib/api/settings/types";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: "Inventory Management",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",
  companyWebsite: "",
  currencySymbol: "Rs.",
  taxLabel: "Tax",
  taxRate: 0,
};

function formatCurrency(value: string | number, symbol: string) {
  return `${symbol} ${Number(value).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
};

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      salesOrdersApi.get(id),
      settingsApi.get(),
    ]).then(([orderRes, settingsRes]) => {
      if (orderRes.data?.success) setOrder(orderRes.data.data);
      else setNotFound(true);
      if (settingsRes.data?.success) setSettings(settingsRes.data.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading invoice…
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Order not found.
      </div>
    );
  }

  const sym = settings.currencySymbol || "Rs.";
  const subtotal = order.items.reduce((s, i) => s + Number(i.totalPrice), 0);
  const discountAmount = Number(order.discountAmount ?? 0);
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = settings.taxRate > 0 ? taxable * (settings.taxRate / 100) : 0;
  const grandTotal = taxable + taxAmount;
  const amountPaid = Number(order.amountPaid);
  const balanceDue = grandTotal - amountPaid;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden bg-white border-b px-6 py-3 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link
          href={`/sales-orders/${id}`}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Order
        </Link>
        <div className="flex-1" />
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print Invoice
        </button>
      </div>

      {/* Invoice Sheet */}
      <div className="max-w-3xl mx-auto my-8 print:my-0 print:max-w-full bg-white shadow-lg print:shadow-none rounded-lg overflow-hidden">

        {/* Header Band */}
        <div className="bg-gray-900 text-white px-10 py-8 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-1">Bill From</p>
            <h1 className="text-2xl font-bold">{settings.companyName}</h1>
            {settings.companyAddress && (
              <p className="text-gray-400 text-xs mt-1 max-w-xs">{settings.companyAddress}</p>
            )}
            {settings.companyPhone && (
              <p className="text-gray-400 text-xs mt-0.5">{settings.companyPhone}</p>
            )}
            {settings.companyEmail && (
              <p className="text-gray-400 text-xs mt-0.5">{settings.companyEmail}</p>
            )}
            <p className="text-gray-500 text-xs mt-2">{order.warehouse.name}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black tracking-tight text-white">INVOICE</p>
            <p className="font-mono text-gray-300 mt-1">{order.orderNumber}</p>
            <div className="flex items-center gap-2 mt-2 justify-end">
              <span
                className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${
                  order.status === "FULFILLED"
                    ? "bg-green-500 text-white"
                    : order.status === "CONFIRMED"
                    ? "bg-blue-500 text-white"
                    : order.status === "CANCELLED"
                    ? "bg-red-500 text-white"
                    : "bg-yellow-500 text-gray-900"
                }`}
              >
                {STATUS_LABEL[order.status]}
              </span>
              <span
                className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${
                  order.paymentStatus === "PAID"
                    ? "bg-green-500 text-white"
                    : order.paymentStatus === "PARTIAL"
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-red-500 text-white"
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Meta Row */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          <div className="px-8 py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Invoice Date</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
          </div>
          <div className="px-8 py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Order Number</p>
            <p className="text-sm font-mono font-semibold text-gray-900">{order.orderNumber}</p>
          </div>
          <div className="px-8 py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Prepared By</p>
            <p className="text-sm font-semibold text-gray-900">{order.createdByUser?.name || "—"}</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="px-10 py-6 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Bill To</p>
          <p className="text-lg font-bold text-gray-900">{order.customer.name}</p>
          {order.customer.phone && (
            <p className="text-sm text-gray-600 mt-0.5">{order.customer.phone}</p>
          )}
          {order.customer.email && (
            <p className="text-sm text-gray-600">{order.customer.email}</p>
          )}
          {order.customer.address && (
            <p className="text-sm text-gray-500 mt-1 max-w-xs">{order.customer.address}</p>
          )}
        </div>

        {/* Items Table */}
        <div className="px-10 py-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-2 text-xs font-bold text-gray-500 uppercase tracking-wide pb-3">#</th>
                <th className="text-left py-2 text-xs font-bold text-gray-500 uppercase tracking-wide pb-3">Product</th>
                <th className="text-left py-2 text-xs font-bold text-gray-500 uppercase tracking-wide pb-3">SKU</th>
                <th className="text-right py-2 text-xs font-bold text-gray-500 uppercase tracking-wide pb-3">Qty</th>
                <th className="text-right py-2 text-xs font-bold text-gray-500 uppercase tracking-wide pb-3">Unit Price</th>
                <th className="text-right py-2 text-xs font-bold text-gray-500 uppercase tracking-wide pb-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="py-3 font-medium text-gray-900">{item.product.name}</td>
                  <td className="py-3 font-mono text-xs text-gray-500">{item.product.sku || "—"}</td>
                  <td className="py-3 text-right text-gray-700">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-700">{formatCurrency(item.unitPrice, sym)}</td>
                  <td className="py-3 text-right font-semibold text-gray-900">{formatCurrency(item.totalPrice, sym)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-10 pb-6 flex justify-end">
          <div className="w-64">
            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-900">{formatCurrency(subtotal, sym)}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
              <span className="text-gray-500">
                Discount / Savings
                {order.discountType === "PERCENTAGE" && Number(order.discountValue) > 0
                  ? ` (${Number(order.discountValue)}%)`
                  : ""}
              </span>
              <span className="font-medium text-green-700">
                {discountAmount > 0 ? `− ${formatCurrency(discountAmount, sym)}` : formatCurrency(0, sym)}
              </span>
            </div>
            {settings.taxRate > 0 ? (
              <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                <span className="text-gray-500">{settings.taxLabel} ({settings.taxRate}%)</span>
                <span className="font-medium text-gray-900">{formatCurrency(taxAmount, sym)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                <span className="text-gray-500">{settings.taxLabel}</span>
                <span className="text-gray-400">—</span>
              </div>
            )}
            <div className="flex justify-between py-3 mt-1 border-b border-gray-200">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-xl font-black text-gray-900">{formatCurrency(grandTotal, sym)}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-medium text-green-700">{formatCurrency(amountPaid, sym)}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Balance Due</span>
              <span className={`font-semibold ${balanceDue > 0 ? "text-red-700" : "text-gray-400"}`}>
                {formatCurrency(balanceDue, sym)}
              </span>
            </div>
            {order.paymentMethod && (
              <div className="flex justify-between text-xs py-1.5 text-gray-400">
                <span>Payment Method</span>
                <span className="font-medium text-gray-600">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="px-10 pb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 px-10 py-5 flex items-center justify-between border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Generated on {new Date().toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          <p className="text-sm font-semibold text-gray-500">Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}
