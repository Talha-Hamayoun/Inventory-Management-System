"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/src/components/ui/modal";
import { POS_PAYMENT_METHODS, type PaymentMethod } from "@/src/lib/api/sales-orders/types";
import { cn } from "@/src/lib/utils";
import { Loader2, X } from "lucide-react";

function formatMoney(value: number) {
  return `Rs ${value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

interface PaymentModalProps {
  isOpen: boolean;
  grandTotal: number;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    paymentMethod: PaymentMethod;
    amountPaid: number;
    amountReceived: number;
  }) => void;
}

export function PaymentModal({
  isOpen,
  grandTotal,
  submitting,
  onClose,
  onConfirm,
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [received, setReceived] = useState(grandTotal);

  useEffect(() => {
    if (isOpen) {
      setMethod("CASH");
      setReceived(grandTotal);
    }
  }, [isOpen, grandTotal]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, submitting, onClose]);

  const changeDue = method === "CASH" ? Math.max(0, received - grandTotal) : 0;
  const cashShort = method === "CASH" && received + 0.001 < grandTotal;

  return (
    <Modal isOpen={isOpen} onClose={() => !submitting && onClose()} size="md">
      <ModalHeader>
        <ModalTitle>Payment / Checkout</ModalTitle>
        <Button variant="ghost" size="icon" onClick={onClose} disabled={submitting}>
          <X className="h-4 w-4" />
        </Button>
      </ModalHeader>
      <ModalContent className="space-y-4">
        <div className="rounded-2xl bg-blue-600 px-4 py-5 text-center text-white shadow-lg shadow-blue-600/20">
          <p className="text-xs uppercase tracking-wide text-blue-100">Total Amount</p>
          <p className="mt-1 text-3xl font-bold">{formatMoney(grandTotal)}</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Payment Method</p>
          <div className="grid grid-cols-2 gap-2">
            {POS_PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-sm font-medium cursor-pointer",
                  method === m.value
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {method === "CASH" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Amount Received</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={received}
                onChange={(e) => setReceived(Number(e.target.value) || 0)}
                className="h-11 text-lg font-semibold"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <span className="text-sm font-medium text-emerald-800">Change Due</span>
              <span className="text-xl font-bold text-emerald-700">{formatMoney(changeDue)}</span>
            </div>
            {cashShort && (
              <p className="text-sm text-rose-600">
                Received amount must be at least the grand total for cash payments.
              </p>
            )}
          </div>
        )}
      </ModalContent>
      <ModalFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={submitting || cashShort}
          onClick={() =>
            onConfirm({
              paymentMethod: method,
              amountPaid: grandTotal,
              amountReceived: method === "CASH" ? received : grandTotal,
            })
          }
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Complete Sale
        </Button>
      </ModalFooter>
    </Modal>
  );
}
