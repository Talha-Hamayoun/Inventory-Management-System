"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/src/components/ui/modal";
import type { SalesOrder } from "@/src/lib/api/sales-orders/types";
import { PAYMENT_METHOD_LABELS } from "@/src/lib/api/sales-orders/types";
import { CheckCircle2, Printer, ReceiptText } from "lucide-react";

function formatMoney(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `Rs ${n.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

interface ReceiptProps {
  isOpen: boolean;
  order: (SalesOrder & {
    amountReceived?: string | number | null;
    changeDue?: string | number | null;
    subtotal?: number;
    tax?: number;
  }) | null;
  onClose: () => void;
  onNewSale: () => void;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}

function TotalRow({
  label,
  value,
  emphasize,
  muted,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        emphasize ? "text-base font-bold text-gray-900" : "text-sm"
      } ${muted ? "text-gray-500" : "text-gray-700"}`}
    >
      <span>{label}</span>
      <span className={emphasize ? "text-blue-700" : "font-medium tabular-nums text-gray-900"}>
        {value}
      </span>
    </div>
  );
}

export function Receipt({ isOpen, order, onClose, onNewSale }: ReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const printReceipt = () => {
    if (!printRef.current || !order) return;
    const html = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=420,height=720");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt ${order.orderNumber}</title>
      <style>
        @page { size: 80mm auto; margin: 5mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          font-size: 12px;
          color: #111827;
          background: #fff;
        }
        img { max-height: 44px; width: auto; margin: 0 auto 8px; display: block; }
        .center { text-align: center; }
        .flex { display: flex; }
        .items-start { align-items: flex-start; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .gap-4 { gap: 12px; }
        .gap-3 { gap: 8px; }
        .gap-1 { gap: 4px; }
        .shrink-0 { flex-shrink: 0; }
        .text-right { text-align: right; }
        .text-sm { font-size: 12px; }
        .text-base { font-size: 14px; }
        .text-xs { font-size: 11px; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        .text-gray-500, .text-gray-400 { color: #6b7280; }
        .text-gray-700 { color: #374151; }
        .text-gray-900 { color: #111827; }
        .text-blue-700 { color: #1d4ed8; }
        .text-emerald-700 { color: #047857; }
        .border-t { border-top: 1px solid #e5e7eb; }
        .border-dashed { border-top-style: dashed; }
        .pt-3 { padding-top: 10px; }
        .mt-3 { margin-top: 10px; }
        .mt-4 { margin-top: 14px; }
        .mb-1 { margin-bottom: 4px; }
        .space-y-1\\.5 > * + * { margin-top: 6px; }
        .space-y-2 > * + * { margin-top: 8px; }
        .space-y-3 > * + * { margin-top: 10px; }
        .rounded-xl, .rounded-2xl, .rounded-full, .shadow-sm, .ring-1, .bg-gray-50,
        .bg-emerald-50, .bg-blue-50, .from-slate-50, .to-white { }
        .bg-gradient-to-b, .via-white { background: #fff !important; }
        .p-5, .px-4, .py-3, .p-4 { }
        .hidden, .print\\:hidden { display: none !important; }
        .print\\:block { display: block !important; }
      </style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 200);
  };

  if (!order) return null;

  const subtotal =
    order.subtotal ??
    order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const discountAmount = Number(order.discountAmount ?? 0);
  const tax = order.tax ?? 0;
  const received = Number(order.amountReceived ?? order.amountPaid ?? order.totalAmount);
  const change = Number(order.changeDue ?? Math.max(0, received - Number(order.totalAmount)));
  const paymentLabel = order.paymentMethod
    ? PAYMENT_METHOD_LABELS[order.paymentMethod]
    : "—";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>
        <ModalTitle className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <span>
            Sale Completed
            <span className="mt-0.5 block text-xs font-normal text-gray-500">
              Payment recorded successfully
            </span>
          </span>
        </ModalTitle>
      </ModalHeader>

      <ModalContent className="bg-gray-50/80 dark:bg-transparent">
        <div
          ref={printRef}
          className="mx-auto max-w-[360px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-200 dark:bg-gray-50"
        >
          {/* Brand header */}
          <div className="border-b border-gray-100 bg-gradient-to-b from-slate-50 to-white px-5 pb-4 pt-5 text-center dark:from-gray-100 dark:to-gray-50">
            <Image
              src="/Logo2.png"
              alt="AutoLine"
              width={160}
              height={52}
              className="mx-auto h-11 w-auto object-contain"
              unoptimized
            />
            <p className="mt-2 text-base font-bold tracking-tight text-gray-900">AutoLine</p>
            <p className="text-xs text-gray-500">Inventory & Spare Parts</p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20 print:hidden">
              <ReceiptText className="h-3.5 w-3.5" />
              Paid in full
            </div>
          </div>

          <div className="space-y-4 px-5 py-4">
            {/* Meta */}
            <div className="space-y-1.5 rounded-xl bg-gray-50 px-3 py-3 dark:bg-gray-100">
              <MetaRow label="Receipt" value={order.orderNumber} />
              <MetaRow label="Date" value={formatDate(order.createdAt)} />
              <MetaRow label="Cashier" value={order.createdByUser?.name ?? "—"} />
              <MetaRow label="Customer" value={order.customer?.name ?? "Walk-in"} />
            </div>

            {/* Items */}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Items
              </p>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="border-b border-dashed border-gray-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-semibold leading-snug text-gray-900">
                      {item.product.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-3 text-xs text-gray-500">
                      <span>
                        {item.quantity} × {formatMoney(item.unitPrice)}
                      </span>
                      <span className="font-semibold tabular-nums text-gray-900">
                        {formatMoney(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-dashed border-gray-200 pt-3">
              <TotalRow label="Subtotal" value={formatMoney(subtotal)} muted />
              <TotalRow label="Discount" value={`−${formatMoney(discountAmount)}`} muted />
              <TotalRow label="Tax" value={formatMoney(tax)} muted />
              <div className="rounded-xl bg-blue-50 px-3 py-2.5 dark:bg-blue-500/10">
                <TotalRow
                  label="Grand Total"
                  value={formatMoney(order.totalAmount)}
                  emphasize
                />
              </div>
            </div>

            {/* Payment */}
            <div className="space-y-1.5 border-t border-dashed border-gray-200 pt-3">
              <MetaRow label="Payment" value={paymentLabel} />
              <MetaRow label="Amount Received" value={formatMoney(received)} />
              <MetaRow label="Change" value={formatMoney(change)} />
            </div>

            <p className="center pt-1 text-center text-xs text-gray-400">
              Thank you for your purchase!
            </p>
          </div>
        </div>
      </ModalContent>

      <ModalFooter className="flex-wrap justify-between gap-2">
        <Button type="button" variant="outline" onClick={printReceipt} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Receipt
        </Button>
        <div className="flex gap-2">
          <Link href={`/sales-orders/${order.id}`}>
            <Button type="button" variant="outline">
              View Sales Order
            </Button>
          </Link>
          <Button type="button" onClick={onNewSale} className="bg-blue-600 hover:bg-blue-700">
            New Sale
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
