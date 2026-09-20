/**
 * EAN-13 barcode generation — keep in sync with frontend/src/lib/ean13.ts
 */

import { prisma } from "./prisma";

export function ean13CheckDigit(digits12: string): string {
  if (!/^\d{12}$/.test(digits12)) {
    throw new Error("EAN-13 body must be exactly 12 digits");
  }
  const sum = digits12.split("").reduce((acc, digit, index) => {
    return acc + Number(digit) * (index % 2 === 0 ? 1 : 3);
  }, 0);
  return String((10 - (sum % 10)) % 10);
}

export function isValidEan13(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;
  const body = value.slice(0, 12);
  return ean13CheckDigit(body) === value[12];
}

/** Keep first 12 digits, recompute check digit. */
export function repairEan13CheckDigit(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 12 && digits.length !== 13) return null;
  const body = digits.slice(0, 12);
  return `${body}${ean13CheckDigit(body)}`;
}

/** In-store / internal EAN-13 (prefix 2). */
export function buildEan13(prefix = "2"): string {
  const safePrefix = prefix.replace(/\D/g, "") || "2";
  const bodyLength = 12;
  if (safePrefix.length >= bodyLength) {
    throw new Error("EAN-13 prefix must be shorter than 12 digits");
  }
  let body = safePrefix;
  while (body.length < bodyLength) {
    body += Math.floor(Math.random() * 10).toString();
  }
  body = body.slice(0, bodyLength);
  return `${body}${ean13CheckDigit(body)}`;
}

export async function generateUniqueBarcode(excludeProductId?: number): Promise<string> {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const barcode = buildEan13("2");
    const existing = await prisma.product.findFirst({
      where: {
        barcode,
        ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
      },
    });
    if (!existing) return barcode;
  }
  throw new Error("Unable to generate a unique barcode");
}

/** Ensure repaired barcode is unique; if clash, generate a fresh one. */
export async function repairOrReplaceBarcode(
  current: string,
  excludeProductId: number
): Promise<{ barcode: string; repaired: boolean }> {
  const repaired = repairEan13CheckDigit(current);
  if (repaired && repaired !== current) {
    const clash = await prisma.product.findFirst({
      where: {
        barcode: repaired,
        NOT: { id: excludeProductId },
        isDeleted: false,
      },
      select: { id: true },
    });
    if (!clash) return { barcode: repaired, repaired: true };
  }
  const barcode = await generateUniqueBarcode(excludeProductId);
  return { barcode, repaired: false };
}
