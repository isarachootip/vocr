import assert from "node:assert/strict";
import {
  normalizeThaiDateToIso,
  formatIsoToThaiDate,
} from "../../src/lib/domain/thai-date";
import {
  parseDocumentNumber,
  parseTrailingDiscount,
  roundCurrency,
} from "../../src/lib/domain/number-parser";

export function runNormalizerTests(): void {
  // 1. 4-digit Buddhist Era dates (e.g., Image 1 & 2: 06/10/2569 -> 2026-10-06)
  assert.equal(normalizeThaiDateToIso("06/10/2569"), "2026-10-06");
  assert.equal(normalizeThaiDateToIso("01/09/2571"), "2028-09-01");
  assert.equal(normalizeThaiDateToIso("04/02/2573"), "2030-02-04");

  // 2. 2-digit Buddhist Era handwritten stamp date (e.g., Image 3: "13 / 10 / 69" -> 2026-10-13)
  assert.equal(normalizeThaiDateToIso("13 / 10 / 69"), "2026-10-13");
  assert.equal(normalizeThaiDateToIso("14/10/69"), "2026-10-14");

  // 3. Already ISO or Common Era dates
  assert.equal(normalizeThaiDateToIso("2026-10-06"), "2026-10-06");
  assert.equal(normalizeThaiDateToIso("14/10/2026"), "2026-10-14");

  // 4. Blank or dash dates (e.g., Image 3 empty header dates)
  assert.equal(normalizeThaiDateToIso(""), null);
  assert.equal(normalizeThaiDateToIso("-"), null);
  assert.equal(normalizeThaiDateToIso(null), null);
  assert.equal(normalizeThaiDateToIso("   /  /   "), null);

  // 5. Format ISO back to Thai BE DD/MM/YYYY for UI display
  assert.equal(formatIsoToThaiDate("2026-10-06"), "06/10/2569");
  assert.equal(formatIsoToThaiDate("2030-02-04"), "04/02/2573");
  assert.equal(formatIsoToThaiDate(null), "");

  // 6. Trailing minus sign on discounts (Image 1: "516.80-")
  assert.equal(parseTrailingDiscount("516.80-"), 516.8);
  assert.equal(parseTrailingDiscount("-516.80"), 516.8);
  assert.equal(parseTrailingDiscount("1,250.50-"), 1250.5);
  assert.equal(parseTrailingDiscount(""), 0);
  assert.equal(parseTrailingDiscount(null), 0);

  // 7. Standard currency and quantity strings
  assert.equal(parseDocumentNumber("2,523.20"), 2523.2);
  assert.equal(parseDocumentNumber("38,960.00"), 38960.0);
  assert.equal(parseDocumentNumber(163), 163);
  assert.equal(roundCurrency(2358.1308), 2358.13);

  console.log("  ✓ Normalizer tests passed (Thai BE Dates & Trailing Discounts)");
}
