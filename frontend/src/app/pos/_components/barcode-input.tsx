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
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  placeholder?: string;
}

/**
 * Keyboard / USB barcode scanner field.
 * Scanners typically send characters then Enter — handled here without redesign.
 */
export const BarcodeInput = forwardRef<HTMLInputElement, BarcodeInputProps>(
  function BarcodeInput(
    {
      id = "pos-barcode-input",
      value,
      onChange,
      onSubmit,
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
          <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600 dark:text-blue-400" />
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
            className="h-10 border-blue-200 bg-gray-50 pl-9 font-mono text-sm tracking-wide focus:ring-blue-600 dark:border-blue-500/30"
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
