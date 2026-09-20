"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/src/components/ui/modal";
import type { SalesOrder } from "@/src/lib/api/sales-orders/types";
import { PAYMENT_METHOD_LABELS } from "@/src/lib/api/sales-orders/types";
import { CheckCircle2, Printer } from "lucide-react";

function formatMoney(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `Rs ${n.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
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

export function Receipt({ isOpen, order, onClose, onNewSale }: ReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const printReceipt = () => {
    if (!printRef.current) return;
    const html = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=400,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt ${order?.orderNumber ?? ""}</title>
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #111; }
        .center { text-align: center; }
        .row { display: flex; justify-content: space-between; gap: 8px; margin: 2px 0; }
        .muted { color: #555; }
        .line { border-top: 1px dashed #999; margin: 8px 0; }
        .bold { font-weight: 700; }
        img { max-height: 48px; width: auto; margin: 0 auto 6px; display: block; }
      </style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  if (!order) return null;

  const subtotal =
    order.subtotal ??
    order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const discountAmount = Number(order.discountAmount ?? 0);
  const tax = order.tax ?? 0;
  const received = Number(order.amountReceived ?? order.amountPaid ?? order.totalAmount);
  const change = Number(order.changeDue ?? Math.max(0, received - Number(order.totalAmount)));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>
        <ModalTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          Sale Completed
        </ModalTitle>
      </ModalHeader>
      <ModalContent>
        <div ref={printRef} className="mx-auto max-w-sm rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-900">
          <div className="center">
            <Image src="/Logo2.png" alt="AutoLine" width={180} height={60} className="mx-auto h-12 w-auto object-contain" unoptimized />
            <p className="bold text-base">AutoLine</p>
            <p className="muted">Inventory & Spare Parts</p>
          </div>
          <div className="line" />
          <div className="row"><span>Receipt</span><span className="bold">{order.orderNumber}</span></div>
          <div className="row"><span>Date</span><span>{formatDate(order.createdAt)}</span></div>
          <div className="row"><span>Cashier</span><span>{order.createdByUser?.name ?? "—"}</span></div>
          <div className="row"><span>Customer</span><span>{order.customer?.name ?? "Walk-in"}</span></div>
          <div className="line" />
          {order.items.map((item) => (
            <div key={item.id} className="mb-2">
              <div className="bold">{item.product.name}</div>
              <div className="row muted">
                <span>
                  {item.quantity} × {formatMoney(item.unitPrice)}
                </span>
                <span>{formatMoney(item.totalPrice)}</span>
              </div>
            </div>
          ))}
          <div className="line" />
          <div className="row"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
          <div className="row"><span>Discount</span><span>−{formatMoney(discountAmount)}</span></div>
          <div className="row"><span>Tax</span><span>{formatMoney(tax)}</span></div>
          <div className="row bold text-base"><span>Grand Total</span><span>{formatMoney(order.totalAmount)}</span></div>
          <div className="line" />
          <div className="row">
            <span>Payment</span>
            <span>{order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : "—"}</span>
          </div>
          <div className="row"><span>Amount Received</span><span>{formatMoney(received)}</span></div>
          <div className="row"><span>Change</span><span>{formatMoney(change)}</span></div>
          <div className="line" />
          <p className="center muted">Thank you for your purchase!</p>
        </div>
      </ModalContent>
      <ModalFooter className="flex-wrap justify-between gap-2">
        <Button type="button" variant="outline" onClick={printReceipt} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Receipt
        </Button>
        <div className="flex gap-2">
          <Link href={`/sales-orders/${order.id}`}>
            <Button type="button" variant="outline">View Sales Order</Button>
          </Link>
          <Button type="button" onClick={onNewSale}>New Sale</Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
