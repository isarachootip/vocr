import type {
  DeliveryDocumentInput,
  ValidationIssue,
  ValidationSummary,
} from "../schemas/document.schema";
import { roundCurrency } from "./number-parser";

const CURRENCY_TOLERANCE = 0.03;
const QTY_TOLERANCE = 0.001;

export function validateDeliveryDocument(doc: DeliveryDocumentInput): ValidationSummary {
  const issues: ValidationIssue[] = [];
  let lotQtyMatch = true;
  let lineMathMatch = true;
  let grossTotalMatch = true;
  let vatReconciled = true;
  let expiryDateValid = true;

  // Check missing header dates (Warning only, as seen in Image 3)
  if (!doc.billingDate) {
    issues.push({
      code: "MISSING_BILLING_DATE",
      severity: "WARNING",
      field: "billingDate",
      message: "ไม่พบวันที่ Billing Date ในส่วนหัวเอกสาร (สามารถเว้นว่างหรือใช้วันที่รับของแทนได้)",
    });
  }

  let sumLineAmounts = 0;

  for (const item of doc.items) {
    // Rule 1: Sum of Lot Quantities == Item Total Quantity
    const sumLotQty = roundCurrency(
      item.lots.reduce((acc, lot) => acc + lot.qty, 0)
    );
    if (Math.abs(sumLotQty - item.totalQty) > QTY_TOLERANCE) {
      lotQtyMatch = false;
      issues.push({
        code: "LOT_QTY_MISMATCH",
        severity: "ERROR",
        field: `items[${item.lineNo}].totalQty`,
        message: `รายการที่ ${item.lineNo} (${item.materialCode}): ผลรวมจำนวนแต่ละ Lot (${sumLotQty}) ไม่ตรงกับจำนวนรวมของรายการ (${item.totalQty})`,
        expected: item.totalQty,
        actual: sumLotQty,
      });
    }

    // Rule 2: Lot-level and Line-level price calculation: (Qty * UnitPrice) - Discount = Amount
    let sumLotAmounts = 0;
    for (const lot of item.lots) {
      const expectedLotAmt = roundCurrency(lot.qty * lot.unitPrice - lot.discount);
      sumLotAmounts = roundCurrency(sumLotAmounts + lot.lotAmount);

      if (Math.abs(expectedLotAmt - lot.lotAmount) > CURRENCY_TOLERANCE) {
        lineMathMatch = false;
        issues.push({
          code: "LOT_MATH_MISMATCH",
          severity: "ERROR",
          field: `items[${item.lineNo}].lots[${lot.lotNo}].lotAmount`,
          message: `รายการที่ ${item.lineNo} Lot ${lot.lotNo}: คำนวณ (${lot.qty} × ${lot.unitPrice} - ${lot.discount}) ได้ ${expectedLotAmt} แต่ยอดในใบส่งของคือ ${lot.lotAmount}`,
          expected: expectedLotAmt,
          actual: lot.lotAmount,
        });
      }

      // Rule 5: Expiry Date > Mfg Date
      if (lot.mfgDate && lot.expDate && lot.expDate <= lot.mfgDate) {
        expiryDateValid = false;
        issues.push({
          code: "INVALID_EXPIRY_DATE",
          severity: "ERROR",
          field: `items[${item.lineNo}].lots[${lot.lotNo}].expDate`,
          message: `รายการที่ ${item.lineNo} Lot ${lot.lotNo}: วันหมดอายุ (${lot.expDate}) ต้องมากกว่าวันผลิต (${lot.mfgDate})`,
        });
      }
    }

    if (Math.abs(sumLotAmounts - item.lineAmount) > CURRENCY_TOLERANCE) {
      lineMathMatch = false;
      issues.push({
        code: "ITEM_LOT_AMOUNT_MISMATCH",
        severity: "ERROR",
        field: `items[${item.lineNo}].lineAmount`,
        message: `รายการที่ ${item.lineNo}: ผลรวมจำนวนเงินของทุก Lot (${sumLotAmounts}) ไม่ตรงกับจำนวนเงินของรายการ (${item.lineAmount})`,
        expected: item.lineAmount,
        actual: sumLotAmounts,
      });
    }

    sumLineAmounts = roundCurrency(sumLineAmounts + item.lineAmount);
  }

  // Rule 3: Sum of Line Amounts == Gross Amount (รวมเงิน)
  if (Math.abs(sumLineAmounts - doc.grossAmount) > CURRENCY_TOLERANCE) {
    grossTotalMatch = false;
    issues.push({
      code: "GROSS_TOTAL_MISMATCH",
      severity: "ERROR",
      field: "grossAmount",
      message: `ผลรวมจำนวนเงินทุกรายการ (${sumLineAmounts}) ไม่ตรงกับช่องรวมเงิน (${doc.grossAmount})`,
      expected: doc.grossAmount,
      actual: sumLineAmounts,
    });
  }

  // Rule 4: Subtotal Excl VAT + VAT 7% == Net Amount (ยอดชำระเงิน)
  const computedNet = roundCurrency(doc.subtotalExclVat + doc.vatAmount);
  const expectedVat = roundCurrency((doc.subtotalExclVat * doc.vatRate) / 100);
  if (
    Math.abs(computedNet - doc.netAmount) > CURRENCY_TOLERANCE ||
    Math.abs(doc.grossAmount - doc.netAmount) > CURRENCY_TOLERANCE ||
    Math.abs(expectedVat - doc.vatAmount) > CURRENCY_TOLERANCE
  ) {
    vatReconciled = false;
    issues.push({
      code: "VAT_RECONCILIATION_MISMATCH",
      severity: "ERROR",
      field: "netAmount",
      message: `มูลค่าไม่รวมภาษี (${doc.subtotalExclVat}) + VAT (${doc.vatAmount}) = ${computedNet} ไม่ดุลกับยอดชำระเงิน (${doc.netAmount})`,
      expected: doc.netAmount,
      actual: computedNet,
    });
  }

  const hasErrors = issues.some((i) => i.severity === "ERROR");

  return {
    isValid: !hasErrors,
    lotQtyMatch,
    lineMathMatch,
    grossTotalMatch,
    vatReconciled,
    expiryDateValid,
    issues,
  };
}
