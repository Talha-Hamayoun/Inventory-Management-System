"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { POS_PAYMENT_METHODS, type PaymentMethod } from "@/src/lib/api/sales-orders/types";
import { resolveDiscount, type DiscountType } from "@/src/lib/sales-order-discount";
import { cn } from "@/src/lib/utils";

function formatRs(value: number) {
  return `Rs. ${value.toLocaleString()}`;
}

interface OrderSummaryProps {
  subtotal: number;
  discountType: DiscountType;
  discountValue: string;
  onDiscountTypeChange: (type: DiscountType) => void;
  onDiscountValueChange: (value: string) => void;
  paymentMethod: PaymentMethod | "";
  onPaymentMethodChange: (method: PaymentMethod) => void;
  cashReceived: string;
  onCashReceivedChange: (value: string) => void;
}

export function OrderSummary({
  subtotal,
  discountType,
  discountValue,
  onDiscountTypeChange,
  onDiscountValueChange,
  paymentMethod,
  onPaymentMethodChange,
  cashReceived,
  onCashReceivedChange,
}: OrderSummaryProps) {
  const parsedDiscount = Number(discountValue);
  const discount = resolveDiscount(subtotal, discountType, parsedDiscount);
  const invoiceTotal = discount.invoiceTotal;
  const cashValue = Number(cashReceived);
  const parsedCash = Number.isFinite(cashValue) ? cashValue : 0;
  const changeDue = paymentMethod === "CASH" ? parsedCash - invoiceTotal : 0;
  const cashShort = paymentMethod === "CASH" && parsedCash < invoiceTotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-900">{formatRs(subtotal)}</span>
          </div>

          <div className="rounded-xl bg-gray-50 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-gray-700">Discount (optional)</label>
              <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => onDiscountTypeChange("FIXED")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium",
                    discountType === "FIXED" ? "bg-blue-600 text-white" : "text-gray-600"
                  )}
                >
                  Fixed (Rs.)
                </button>
                <button
                  type="button"
                  onClick={() => onDiscountTypeChange("PERCENTAGE")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium",
                    discountType === "PERCENTAGE" ? "bg-blue-600 text-white" : "text-gray-600"
                  )}
                >
                  Percentage (%)
                </button>
              </div>
            </div>
            <Input
              type="number"
              min={0}
              max={discountType === "PERCENTAGE" ? 100 : undefined}
              step="0.01"
              value={discountValue}
              onChange={(e) => onDiscountValueChange(e.target.value)}
              placeholder="0"
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
            />
            {discount.error && <p className="text-xs text-red-500">{discount.error}</p>}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Discount / Savings</span>
            <span className="font-medium text-green-700">
              {formatRs(discount.discountAmount)}
              {discountType === "PERCENTAGE" && discount.discountAmount > 0 && Number.isFinite(parsedDiscount) && parsedDiscount > 0
                ? ` (${parsedDiscount}%)`
                : ""}
            </span>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <span className="font-semibold text-gray-800">Invoice Total</span>
            <span className="text-xl font-bold text-gray-900">{formatRs(invoiceTotal)}</span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Payment Method</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {POS_PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => onPaymentMethodChange(method.value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  paymentMethod === method.value
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                )}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {paymentMethod === "CASH" && (
          <div className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cash Received</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={cashReceived}
                onChange={(e) => onCashReceivedChange(e.target.value)}
                placeholder="0"
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Change Due</label>
              <p className={cn("rounded-md border bg-white px-3 py-2 text-sm font-semibold", cashShort ? "border-red-200 text-red-600" : "border-gray-200 text-gray-900")}>
                {formatRs(Math.max(0, changeDue))}
              </p>
            </div>
            {cashShort && (
              <p className="text-xs text-red-500 sm:col-span-2">
                Cash received must be at least the invoice total.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
