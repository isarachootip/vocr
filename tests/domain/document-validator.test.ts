import assert from "node:assert/strict";
import { validateDeliveryDocument } from "../../src/lib/domain/document-validator";
import type { DeliveryDocumentInput } from "../../src/lib/schemas/document.schema";

export function runDocumentValidatorTests(): void {
  // Test Case 1: Image 1 (Single Item, Single Lot with Trailing Discount 516.80-)
  const doc1: DeliveryDocumentInput = {
    billingNo: "3001270751",
    billingDate: "2026-10-06",
    poNo: "-",
    poDate: "2026-09-29",
    salesOrderNo: "100767403",
    salesOrderDate: "2026-09-30",
    deliveryOrderNo: "201660572",
    deliveryOrderDate: "2026-10-05",
    budgetType: "วงเงินเชื่อ",
    docTypeCode: "ZS01/ZB01",
    customerGroup: "6010",
    customerCode: "130006637",
    customerName: "บริษัท เมดิคอล คอร์ปอเรชั่น (ไทยแลนด์) จำกัด",
    customerAddress: "4176 ถนนพระรามที่ 4 แขวงพระโขนง เขตคลองเตย กรุงเทพมหานคร 10110",
    customerTaxId: "0105561114301",
    customerBranch: "สำนักงานใหญ่",
    shipToCode: "130006637",
    shipToName: "บริษัท เมดิคอล คอร์ปอเรชั่น (ไทยแลนด์) จำกัด",
    shipToAddress: "4176 ถนนพระรามที่ 4 แขวงพระโขนง เขตคลองเตย กรุงเทพมหานคร 10110",
    grossAmount: 2523.2,
    subtotalExclVat: 2358.13,
    vatRate: 7.0,
    vatAmount: 165.07,
    netAmount: 2523.2,
    amountInWords: "(สองพันห้าร้อยยี่สิบสามบาทยี่สิบสตางค์)",
    hasStamp: false,
    stampOrderNo: null,
    stampDate: null,
    hasReceiverSig: true,
    receiverName: "ผู้รับของ",
    receivedDate: "2026-10-14",
    hasSenderSig: true,
    senderName: "ภัชรพล",
    sentDate: null,
    authorizedSigner: "นางสาวสารภี จันทะลุน",
    status: "VERIFIED",
    overwriteExisting: false,
    pages: [{ pageNo: 1, totalPages: 1, imageUrl: "/samples/gpo-sample-1.jpg" }],
    items: [
      {
        lineNo: 1,
        materialCode: "110123960111",
        itemDescription: "CYTISINICLINE TABLETS 1.5 MG 10X10's (CYTISINE GPO)",
        tradeName: null,
        gpuCode: "1297088",
        tpuCode: "1297100",
        totalQty: 4,
        unit: "BOX",
        unitPrice: 760,
        discount: 516.8,
        lineAmount: 2523.2,
        lots: [
          {
            lotNo: "S690081",
            mfgDate: "2026-09-01",
            expDate: "2028-09-01",
            qty: 4,
            unit: "BOX",
            unitPrice: 760,
            discount: 516.8,
            lotAmount: 2523.2,
          },
        ],
      },
    ],
  };

  const res1 = validateDeliveryDocument(doc1);
  assert.equal(res1.isValid, true);
  assert.equal(res1.lotQtyMatch, true);
  assert.equal(res1.lineMathMatch, true);
  assert.equal(res1.grossTotalMatch, true);
  assert.equal(res1.vatReconciled, true);
  assert.equal(res1.expiryDateValid, true);

  // Test Case 2: Image 3 (Multi-Lot Item + Empty Header Dates Warning)
  const doc3: DeliveryDocumentInput = {
    ...doc1,
    billingNo: "3001275142",
    billingDate: null,
    poDate: null,
    salesOrderDate: null,
    deliveryOrderDate: null,
    grossAmount: 38960.0,
    subtotalExclVat: 36411.21,
    vatAmount: 2548.79,
    netAmount: 38960.0,
    items: [
      {
        lineNo: 1,
        materialCode: "111407291111",
        itemDescription: "PARACETAMOL TABLETS 500 MG 50x10's (PARA GPO)",
        tradeName: null,
        gpuCode: "747145",
        tpuCode: "402653",
        totalQty: 40,
        unit: "BOX",
        unitPrice: 225,
        discount: 0,
        lineAmount: 9000.0,
        lots: [
          {
            lotNo: "Q-606",
            mfgDate: "2026-02-04",
            expDate: "2030-02-04",
            qty: 24,
            unit: "BOX",
            unitPrice: 225,
            discount: 0,
            lotAmount: 5400.0,
          },
          {
            lotNo: "Q-605",
            mfgDate: "2026-02-03",
            expDate: "2030-02-03",
            qty: 16,
            unit: "BOX",
            unitPrice: 225,
            discount: 0,
            lotAmount: 3600.0,
          },
        ],
      },
      {
        lineNo: 2,
        materialCode: "111401640111",
        itemDescription: "ยาทาแก้ผดผื่นคัน คาลาไมน์ 60 มล. (CALAMINE LOTION)",
        tradeName: null,
        gpuCode: "491053",
        tpuCode: "491292",
        totalQty: 2000,
        unit: "BT",
        unitPrice: 14.98,
        discount: 0,
        lineAmount: 29960.0,
        lots: [
          {
            lotNo: "A690029",
            mfgDate: "2026-05-11",
            expDate: "2030-05-11",
            qty: 2000,
            unit: "BT",
            unitPrice: 14.98,
            discount: 0,
            lotAmount: 29960.0,
          },
        ],
      },
    ],
  };

  const res3 = validateDeliveryDocument(doc3);
  assert.equal(res3.isValid, true);
  assert.equal(res3.lotQtyMatch, true);
  assert.equal(res3.grossTotalMatch, true);
  // Should contain a WARNING because billingDate is null
  assert.equal(
    res3.issues.some((i) => i.severity === "WARNING" && i.code === "MISSING_BILLING_DATE"),
    true
  );

  // Test Case 3: Broken Math & Invalid Expiry Date
  const brokenDoc: DeliveryDocumentInput = {
    ...doc1,
    grossAmount: 9999.0,
    items: [
      {
        ...doc1.items[0],
        totalQty: 10, // Mismatch with Lot qty 4
        lots: [
          {
            ...doc1.items[0].lots[0],
            mfgDate: "2029-01-01",
            expDate: "2027-01-01", // Exp before Mfg!
          },
        ],
      },
    ],
  };

  const resBroken = validateDeliveryDocument(brokenDoc);
  assert.equal(resBroken.isValid, false);
  assert.equal(resBroken.lotQtyMatch, false);
  assert.equal(resBroken.grossTotalMatch, false);
  assert.equal(resBroken.expiryDateValid, false);

  console.log("  ✓ Document Validator tests passed (Single-Lot, Multi-Lot, VAT, Warnings)");
}
