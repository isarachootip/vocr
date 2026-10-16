/**
 * Pure functions for parsing numbers, currency strings, and GPO trailing-minus discounts (e.g. "516.80-").
 */

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function parseDocumentNumber(raw: string | number | null | undefined): number {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? roundCurrency(raw) : 0;
  }
  if (!raw) return 0;

  const cleaned = raw.trim().replace(/,/g, "");
  if (!cleaned || cleaned === "-") return 0;

  const trailingMinus = cleaned.endsWith("-");
  const numericPart = trailingMinus ? cleaned.slice(0, -1) : cleaned;
  const parsed = Number(numericPart);

  if (!Number.isFinite(parsed)) return 0;
  return roundCurrency(trailingMinus ? -Math.abs(parsed) : parsed);
}

/**
 * GPO delivery notes print discounts with a trailing minus sign (e.g. "516.80-").
 * We normalize this into a positive discount amount to subtract in the formula:
 * (Qty * UnitPrice) - Discount = LineAmount
 */
export function parseTrailingDiscount(raw: string | number | null | undefined): number {
  const num = parseDocumentNumber(raw);
  return roundCurrency(Math.abs(num));
}
