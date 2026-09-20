"use client";

import { cn } from "@/src/lib/utils";
import { isValidEan13 } from "@/src/lib/ean13";

const EAN13_L = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011",
];
const EAN13_G = [
  "0100111", "0110011", "0011011", "0100001", "0011101",
  "0111001", "0000101", "0010001", "0001001", "0010111",
];
const EAN13_R = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100",
];
const EAN13_PARITY = [
  "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL",
];

const CODE39: Record<string, string> = {
  "0": "101001101101",
  "1": "110100101011",
  "2": "101100101011",
  "3": "110110010101",
  "4": "101001101011",
  "5": "110100110101",
  "6": "101100110101",
  "7": "101001011011",
  "8": "110100101101",
  "9": "101100101101",
  A: "110101001011",
  B: "101101001011",
  C: "110110100101",
  D: "101011001011",
  E: "110101100101",
  F: "101101100101",
  G: "101010011011",
  H: "110101001101",
  I: "101101001101",
  J: "101011001101",
  K: "110101010011",
  L: "101101010011",
  M: "110110101001",
  N: "101011010011",
  O: "110101101001",
  P: "101101101001",
  Q: "101010110011",
  R: "110101011001",
  S: "101101011001",
  T: "101011011001",
  U: "110010101011",
  V: "100110101011",
  W: "110011010101",
  X: "100101101011",
  Y: "110010110101",
  Z: "100110110101",
  "-": "100101011011",
  ".": "110010101101",
  " ": "100110101101",
  $: "100100100101",
  "/": "100100101001",
  "+": "100101001001",
  "%": "101001001001",
  "*": "100101101101",
};

function bitsToModules(bits: string): { x: number; width: number }[] {
  const bars: { x: number; width: number }[] = [];
  let x = 0;
  let i = 0;
  while (i < bits.length) {
    if (bits[i] === "1") {
      let width = 0;
      while (i < bits.length && bits[i] === "1") {
        width += 1;
        i += 1;
      }
      bars.push({ x, width });
      x += width;
    } else {
      x += 1;
      i += 1;
    }
  }
  return bars;
}

function ean13Bits(value: string): string | null {
  // Only encode valid EAN-13 (correct check digit) so printed labels scan reliably
  if (!isValidEan13(value)) return null;
  const first = Number(value[0]);
  const parity = EAN13_PARITY[first];
  if (!parity) return null;
  let bits = "101";
  for (let i = 0; i < 6; i += 1) {
    const digit = Number(value[i + 1]);
    bits += parity[i] === "L" ? EAN13_L[digit]! : EAN13_G[digit]!;
  }
  bits += "01010";
  for (let i = 7; i < 13; i += 1) {
    bits += EAN13_R[Number(value[i])]!;
  }
  bits += "101";
  return bits;
}

function code39Bits(value: string): string | null {
  const normalized = `*${value.toUpperCase()}*`;
  if (![...normalized].every((char) => CODE39[char])) return null;
  return [...normalized].map((char) => CODE39[char]).join("0");
}

function barcodeBits(value: string): string | null {
  return ean13Bits(value) ?? code39Bits(value);
}

function barcodeLayout(value: string, showValue = true) {
  const bits = barcodeBits(value);
  if (!bits) return null;
  const bars = bitsToModules(bits);
  const width = bits.length;
  const height = 48;
  const quiet = 10;
  const svgHeight = showValue ? height + 22 : height + 8;
  return { bars, width, height, quiet, svgHeight };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function barcodeSvgMarkup(value: string, showValue = true) {
  const layout = barcodeLayout(value, showValue);
  if (!layout) return "";
  const { bars, width, height, quiet, svgHeight } = layout;
  const barRects = bars
    .map(
      (bar) =>
        `<rect x="${bar.x + quiet}" y="4" width="${bar.width}" height="${height}" fill="#111827"/>`
    )
    .join("");
  const caption = showValue
    ? `<text x="${(width + quiet * 2) / 2}" y="${height + 18}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="12" fill="#111827">${escapeHtml(value)}</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Barcode ${escapeHtml(value)}" viewBox="0 0 ${width + quiet * 2} ${svgHeight}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      ${barRects}
      ${caption}
    </svg>`;
}

export function BarcodeSvg({
  value,
  className,
  showValue = true,
}: {
  value: string;
  className?: string;
  showValue?: boolean;
}) {
  const layout = barcodeLayout(value, showValue);
  if (!layout) {
    return (
      <p className="text-sm text-gray-500">Unable to render this barcode value.</p>
    );
  }

  const { bars, width, height, quiet, svgHeight } = layout;

  return (
    <svg
      role="img"
      aria-label={`Barcode ${value}`}
      viewBox={`0 0 ${width + quiet * 2} ${svgHeight}`}
      className={cn("max-w-full h-auto", className)}
    >
      <rect width="100%" height="100%" fill="#ffffff" />
      {bars.map((bar) => (
        <rect
          key={`${bar.x}-${bar.width}`}
          x={bar.x + quiet}
          y={4}
          width={bar.width}
          height={height}
          fill="#111827"
        />
      ))}
      {showValue && (
        <text
          x={(width + quiet * 2) / 2}
          y={height + 18}
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize="12"
          fill="#111827"
        >
          {value}
        </text>
      )}
    </svg>
  );
}

export function BarcodeLabel({
  productName,
  barcode,
  sequence,
  total,
}: {
  productName: string;
  barcode: string;
  sequence: number;
  total: number;
}) {
  return (
    <article className="rounded border border-dashed border-slate-300 bg-white px-3 py-2.5 text-center">
      <p className="mb-2 text-xs font-bold leading-snug text-gray-900">{productName}</p>
      <BarcodeSvg value={barcode} showValue={false} className="h-[72px] w-full" />
      <p className="mt-1 font-mono text-[11px] font-semibold text-gray-900">
        {barcode}{" "}
        <span>
          ({sequence}/{total})
        </span>
      </p>
    </article>
  );
}

function barcodePrintHtml(payload: { productName: string; barcode: string; quantity: number }) {
  const svgMarkup = barcodeSvgMarkup(payload.barcode, false);
  if (!svgMarkup) return "";

  const labels = Array.from({ length: payload.quantity }, (_, index) => {
    const sequence = `${index + 1}/${payload.quantity}`;
    return `<article class="label">
      <p class="name">${escapeHtml(payload.productName)}</p>
      <div class="bars">${svgMarkup}</div>
      <p class="code">${escapeHtml(payload.barcode)} <span>(${sequence})</span></p>
    </article>`;
  }).join("");

  return `<!doctype html>
<html>
  <head>
    <title>Print barcodes — ${escapeHtml(payload.productName)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: #111827;
        background: #fff;
      }
      .sheet {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6mm;
        padding: 8mm;
      }
      .label {
        background: #fff;
        border: 1px dashed #cbd5e1;
        border-radius: 2px;
        padding: 5mm 4mm 4mm;
        text-align: center;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .name {
        margin: 0 0 3mm;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.25;
      }
      .bars svg { width: 100%; height: 18mm; }
      .code {
        margin: 2mm 0 0;
        font-family: ui-monospace, Consolas, monospace;
        font-size: 11px;
        font-weight: 600;
      }
      .code span { font-weight: 700; }
      @media print {
        .sheet { padding: 0; }
        .label { border: 1px solid #d1d5db; }
        @page { margin: 8mm; size: A4; }
      }
    </style>
  </head>
  <body>
    <section class="sheet">${labels}</section>
  </body>
</html>`;
}

export function printBarcode(payload: {
  productName: string;
  barcode: string;
  quantity: number;
}): boolean {
  const quantity = Math.max(0, Math.floor(payload.quantity));
  if (quantity < 1) return false;

  const html = barcodePrintHtml({ ...payload, quantity });
  if (!html) return false;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.srcdoc = html;
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      window.setTimeout(() => iframe.remove(), 1500);
    }
  };
  document.body.appendChild(iframe);
  return true;
}
