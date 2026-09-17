import { prisma } from "./prisma";

function ean13CheckDigit(digits12: string): string {
  const sum = digits12.split("").reduce((acc, digit, index) => {
    return acc + Number(digit) * (index % 2 === 0 ? 1 : 3);
  }, 0);
  return String((10 - (sum % 10)) % 10);
}

function randomDigits(length: number): string {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += Math.floor(Math.random() * 10).toString();
  }
  return value;
}

function buildEan13(): string {
  const body = `2${randomDigits(11)}`;
  return `${body}${ean13CheckDigit(body)}`;
}

export async function generateUniqueBarcode(excludeProductId?: number): Promise<string> {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const barcode = buildEan13();
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
