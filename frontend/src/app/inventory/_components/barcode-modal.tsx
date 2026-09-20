"use client";

import { useEffect, useState } from "react";
import { BarcodeLabel, BarcodeSvg, printBarcode } from "@/src/components/ui/barcode";
import { isValidEan13 } from "@/src/lib/ean13";
import { Button } from "@/src/components/ui/button";
import { Loading } from "@/src/components/ui/loading";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/src/components/ui/modal";
import { productsApi } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth-context";
import type { InventoryItem } from "@/src/lib/api/inventory/types";
import { toast } from "sonner";
import { Printer } from "lucide-react";

interface BarcodeModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (productId: string, barcode: string) => void;
}

export function BarcodeModal({ item, isOpen, onClose, onGenerated }: BarcodeModalProps) {
  const { hasPermission } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const barcode = item?.product.barcode?.trim() || "";
  const availableQuantity = item?.availableQuantity ?? 0;
  const canGenerate = hasPermission("products:update");
  const canPrint = Boolean(barcode) && availableQuantity > 0;

  useEffect(() => {
    if (!isOpen) setShowPreview(false);
  }, [isOpen, item?.id]);

  const handleGenerate = async (force = false) => {
    if (!item) return;
    setGenerating(true);
    try {
      const response = await productsApi.generateBarcode(item.product.id, { force });
      if (!response.data || response.error || response.data.success === false) {
        const message =
          response.data && "message" in response.data
            ? response.data.message
            : "Failed to generate barcode";
        toast.error(message);
        return;
      }
      const next = response.data.data.barcode;
      onGenerated(item.product.id, next);
      if (response.data.repaired) {
        toast.success(`Barcode fixed to valid EAN-13: ${next}. Reprint labels.`);
      } else if (response.data.generated) {
        toast.success(force ? `New barcode assigned: ${next}. Reprint labels.` : "Barcode generated");
      } else {
        toast.success("Barcode already assigned");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    onClose();
  };

  const handlePrint = () => {
    if (!item || !barcode || availableQuantity < 1) {
      toast.error("No available quantity to print");
      return;
    }
    if (!showPreview) {
      setShowPreview(true);
      return;
    }
    const printed = printBarcode({
      productName: item.product.name,
      barcode,
      quantity: availableQuantity,
    });
    if (!printed) {
      toast.error("Unable to open print preview");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size={showPreview ? "lg" : "md"}>
      <ModalHeader>
        <ModalTitle>{showPreview ? "Print Preview" : "Product Barcode"}</ModalTitle>
      </ModalHeader>
      <ModalContent className="space-y-4">
        {item && showPreview && (
          <>
            <p className="text-sm text-gray-500">
              {item.product.name} — {availableQuantity === 1 ? "1 label" : `${availableQuantity} labels`}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: availableQuantity }, (_, index) => (
                <BarcodeLabel
                  key={`${barcode}-${index + 1}`}
                  productName={item.product.name}
                  barcode={barcode}
                  sequence={index + 1}
                  total={availableQuantity}
                />
              ))}
            </div>
          </>
        )}

        {item && !showPreview && (
          <>
            <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-3 text-sm space-y-1">
              <p>
                <span className="text-gray-500">Product Name</span>
                <span className="block font-semibold text-gray-900">{item.product.name}</span>
              </p>
              <p>
                <span className="text-gray-500">SKU</span>
                <span className="block font-medium text-gray-800">{item.product.sku || "—"}</span>
              </p>
              <p>
                <span className="text-gray-500">Barcode Number</span>
                <span className="block font-mono font-semibold text-gray-900">{barcode || "Not assigned"}</span>
                {barcode && (
                  <span className="mt-0.5 block text-[11px] text-gray-500">
                    {isValidEan13(barcode)
                      ? "Format: EAN-13 (camera-ready)"
                      : "Invalid EAN-13 check digit — camera misreads this. Click Fix EAN-13, then reprint."}
                  </span>
                )}
              </p>
              <p>
                <span className="text-gray-500">Available Quantity</span>
                <span className="block font-semibold text-gray-900">{availableQuantity}</span>
              </p>
            </div>

            {barcode ? (
              <div className="flex justify-center rounded-xl border border-gray-200 bg-white p-2">
                <BarcodeSvg value={barcode} className="max-h-28" />
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                This product does not have a barcode yet.
              </p>
            )}
          </>
        )}
      </ModalContent>
      <ModalFooter>
        <Button type="button" variant="outline" onClick={handleClose}>
          Close
        </Button>
        {barcode ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canGenerate && barcode && !isValidEan13(barcode) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleGenerate(false)}
                disabled={generating}
              >
                {generating ? <Loading size="sm" /> : "Fix EAN-13"}
              </Button>
            )}
            <Button
              type="button"
              onClick={handlePrint}
              disabled={!canPrint}
              className="gap-2"
              title={canPrint ? `Print ${availableQuantity} labels` : "No available quantity to print"}
            >
              <Printer className="h-4 w-4" />
              Print Barcode{canPrint ? ` (${availableQuantity})` : ""}
            </Button>
          </div>
        ) : (
          canGenerate && (
            <Button type="button" onClick={() => void handleGenerate(false)} disabled={generating}>
              {generating ? <Loading size="sm" /> : "Generate Barcode"}
            </Button>
          )
        )}
      </ModalFooter>
    </Modal>
  );
}
