export type DiscountType = "FIXED" | "PERCENTAGE";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function resolveDiscount(
  subtotal: number,
  type: DiscountType | null | undefined,
  rawValue: number | null | undefined
) {
  const value = Number(rawValue);
  const amount = Number.isFinite(value) ? value : 0;

  if (amount < 0) {
    return {
      discountAmount: 0,
      invoiceTotal: roundMoney(subtotal),
      error: "Discount cannot be negative",
    };
  }

  if (!type || amount === 0) {
    return {
      discountAmount: 0,
      invoiceTotal: roundMoney(subtotal),
      error: null,
    };
  }

  if (type === "PERCENTAGE") {
    if (amount > 100) {
      return {
        discountAmount: 0,
        invoiceTotal: roundMoney(subtotal),
        error: "Percentage discount must be between 0% and 100%",
      };
    }
    const discountAmount = roundMoney((subtotal * amount) / 100);
    return {
      discountAmount,
      invoiceTotal: roundMoney(Math.max(0, subtotal - discountAmount)),
      error: null,
    };
  }

  if (amount > subtotal) {
    return {
      discountAmount: 0,
      invoiceTotal: roundMoney(subtotal),
      error: "Fixed discount cannot exceed the subtotal",
    };
  }

  const discountAmount = roundMoney(amount);
  return {
    discountAmount,
    invoiceTotal: roundMoney(Math.max(0, subtotal - discountAmount)),
    error: null,
  };
}
