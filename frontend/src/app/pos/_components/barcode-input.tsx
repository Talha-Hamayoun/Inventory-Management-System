"use client";

import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
import { ScanLine } from "lucide-react";
import { forwardRef } from "react";

interface BarcodeInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (code: string) => void;
  onOpenScanner?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  placeholder?: string;
}

/**
 * Keyboard / USB barcode scanner field.
 * Optional camera scanner opens via the barcode icon.
 */
export const BarcodeInput = forwardRef<HTMLInputElement, BarcodeInputProps>(
  function BarcodeInput(
    {
      id = "pos-barcode-input",
      value,
      onChange,
      onSubmit,
      onOpenScanner,
      disabled,
      loading,
      className,
      placeholder = "Scan or type barcode, then Enter",
    },
    ref
  ) {
    return (
      <div
        className={cn(
          "flex h-full flex-col justify-end rounded-xl border-2 border-blue-200 bg-blue-50/70 p-2.5 dark:border-blue-500/40 dark:bg-blue-500/10",
          className
        )}
      >
        <label
          htmlFor={id}
          className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-300"
        >
          <ScanLine className="h-3.5 w-3.5" />
          Barcode
          <span className="ml-auto font-normal normal-case tracking-normal text-blue-600/70 dark:text-blue-400/70">
            F4
          </span>
        </label>
        <div className="relative">
          <button
            type="button"
            disabled={disabled || loading || !onOpenScanner}
            onClick={onOpenScanner}
            className={cn(
              "absolute left-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-blue-600 transition dark:text-blue-400",
              onOpenScanner && !disabled && !loading
                ? "cursor-pointer hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-500/20"
                : "pointer-events-none"
            )}
            title={onOpenScanner ? "Open camera barcode scanner" : undefined}
            aria-label={onOpenScanner ? "Open camera barcode scanner" : undefined}
          >
            <ScanLine className="h-4 w-4" />
          </button>
          <Input
            ref={ref}
            id={id}
            name="pos-barcode"
            value={value}
            disabled={disabled || loading}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="numeric"
            placeholder={placeholder}
            className="h-10 border-blue-200 bg-gray-50 pl-10 font-mono text-sm tracking-wide focus:ring-blue-600 dark:border-blue-500/30"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              e.stopPropagation();
              const code = value.trim();
              if (code) onSubmit(code);
            }}
          />
        </div>
      </div>
    );
  }
);
