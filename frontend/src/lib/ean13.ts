/**
 * EAN-13 helpers — keep in sync with backend/src/lib/barcode.ts
 * Used for validation, display, and (optional) client-side preview generation.
 */

export function ean13CheckDigit(digits12: string): string {
  if (!/^\d{12}$/.test(digits12)) {
    throw new Error("EAN-13 body must be exactly 12 digits");
  }
  const sum = digits12.split("").reduce((acc, digit, index) => {
    return acc + Number(digit) * (index % 2 === 0 ? 1 : 3);
  }, 0);
  return String((10 - (sum % 10)) % 10);
}

/** True when value is 13 digits and the check digit is valid. */
export function isValidEan13(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;
  const body = value.slice(0, 12);
  return ean13CheckDigit(body) === value[12];
}

/**
 * Build a valid EAN-13.
 * Prefix `2` = in-store / internal use (same as backend).
 */
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

/** Fix / complete an EAN-13 by recomputing the check digit from the first 12 digits. */
export function withEan13CheckDigit(digits12or13: string): string | null {
  const digits = digits12or13.replace(/\D/g, "");
  if (digits.length === 12) return `${digits}${ean13CheckDigit(digits)}`;
  if (digits.length === 13) return `${digits.slice(0, 12)}${ean13CheckDigit(digits.slice(0, 12))}`;
  return null;
}
