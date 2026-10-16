import assert from "node:assert/strict";
import { mergeMultiPageDocuments } from "../../src/lib/domain/document-merger";
import type { DeliveryDocumentInput } from "../../src/lib/schemas/document.schema";

export function runDocumentMergerTests(): void {
  const page1: DeliveryDocumentInput = {
    billingNo: "3001999999",
    billingDate: "2026-10-06",
    poNo: "-",
    poDate: null,
    salesOrderNo: "100800001",
    salesOrderDate: null,
    deliveryOrderNo: "201700001",
    deliveryOrderDate: null,
    budgetType: "วงเงินเชื่อ",
    docTypeCode: "ZS01/ZB01",
    customerGroup: "6010",
    customerCode: "130006637",
    customerName: "บริษัท เมดิคอล คอร์ปอเรชั่น (ไทยแลนด์) จำกัด",
    customerAddress: "กรุงเทพฯ",
    customerTaxId: "0105561114301",
    customerBranch: "สำนักงานใหญ่",
    shipToCode: "130006637",
    shipToName: "บริษัท เมดิคอล คอร์ปอเรชั่น (ไทยแลนด์) จำกัด",
    shipToAddress: "กรุงเทพฯ",
    grossAmount: 0,
    subtotalExclVat: 0,
    vatRate: 7,
    vatAmount: 0,
    netAmount: 0,
    amountInWords: null,
    hasStamp: false,
    stampOrderNo: null,
    stampDate: null,
    hasReceiverSig: false,
    receiverName: null,
    receivedDate: null,
    hasSenderSig: false,
    senderName: null,
    sentDate: null,
    authorizedSigner: null,
    status: "PENDING_REVIEW",
    overwriteExisting: false,
    pages: [{ pageNo: 1, totalPages: 2, imageUrl: "/uploads/p1.jpg" }],
    items: [
      {
        lineNo: 1,
        materialCode: "1101",
        itemDescription: "DRUG A",
        tradeName: null,
        gpuCode: null,
        tpuCode: null,
        totalQty: 5,
        unit: "BOX",
        unitPrice: 100,
        discount: 0,
        lineAmount: 500,
        lots: [
          {
            lotNo: "L1",
            mfgDate: "2026-01-01",
            expDate: "2028-01-01",
            qty: 5,
            unit: "BOX",
            unitPrice: 100,
            discount: 0,
            lotAmount: 500,
          },
        ],
      },
    ],
  };

  const page2: DeliveryDocumentInput = {
    ...page1,
    grossAmount: 1500,
    subtotalExclVat: 1401.87,
    vatAmount: 98.13,
    netAmount: 1500,
    hasReceiverSig: true,
    receiverName: "สมชาย",
    pages: [{ pageNo: 2, totalPages: 2, imageUrl: "/uploads/p2.jpg" }],
    items: [
      {
        lineNo: 2,
        materialCode: "1102",
        itemDescription: "DRUG B",
        tradeName: null,
        gpuCode: null,
        tpuCode: null,
        totalQty: 10,
        unit: "BOX",
        unitPrice: 100,
        discount: 0,
        lineAmount: 1000,
        lots: [
          {
            lotNo: "L2",
            mfgDate: "2026-01-01",
            expDate: "2028-01-01",
            qty: 10,
            unit: "BOX",
            unitPrice: 100,
            discount: 0,
            lotAmount: 1000,
          },
        ],
      },
    ],
  };

  const merged = mergeMultiPageDocuments([page2, page1]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].pages.length, 2);
  assert.equal(merged[0].pages[0].pageNo, 1);
  assert.equal(merged[0].pages[1].pageNo, 2);
  assert.equal(merged[0].items.length, 2);
  assert.equal(merged[0].items[0].lineNo, 1);
  assert.equal(merged[0].items[1].lineNo, 2);
  assert.equal(merged[0].grossAmount, 1500);
  assert.equal(merged[0].hasReceiverSig, true);

  console.log("  ✓ Document Merger tests passed (Multi-page 1/2 + 2/2 grouping)");
}
