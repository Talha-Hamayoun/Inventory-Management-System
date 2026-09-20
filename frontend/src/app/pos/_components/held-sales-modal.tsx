"use client";

import { Button } from "@/src/components/ui/button";
import { Modal } from "@/src/components/ui/modal";
import type { PosHeldSale } from "@/src/lib/api/pos";
import { PauseCircle, Trash2 } from "lucide-react";

interface HeldSalesModalProps {
  isOpen: boolean;
  sales: PosHeldSale[];
  loading?: boolean;
  onClose: () => void;
  onResume: (sale: PosHeldSale) => void;
  onDelete: (id: string) => void;
}

export function HeldSalesModal({
  isOpen,
  sales,
  loading,
  onClose,
  onResume,
  onDelete,
}: HeldSalesModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Suspended / Held Sales" size="lg">
      <div className="space-y-2">
        {loading && <p className="py-8 text-center text-sm text-gray-500">Loading…</p>}
        {!loading && sales.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
            <PauseCircle className="h-8 w-8 opacity-40" />
            <p className="text-sm">No held sales</p>
          </div>
        )}
        {sales.map((sale) => {
          const itemCount = sale.cartData?.items?.length ?? 0;
          const qty = sale.cartData?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
          return (
            <div
              key={sale.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {sale.label || "Held sale"}
                </p>
                <p className="text-xs text-gray-500">
                  {itemCount} lines · {qty} pcs · {sale.warehouse?.name || "Warehouse"}
                  {sale.customer ? ` · ${sale.customer.name}` : " · Walk-in"}
                </p>
                <p className="text-[11px] text-gray-400">
                  {new Date(sale.updatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => onResume(sale)}>
                  Resume
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-rose-600"
                  onClick={() => onDelete(sale.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
