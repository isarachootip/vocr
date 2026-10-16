import assert from "node:assert/strict";
import {
  normalizeRawOcrPayload,
  type RawGpoOcrPayload,
} from "../../src/lib/services/gpo-prompt";

export function runOcrNormalizerTests(): void {
  const rawPayload: RawGpoOcrPayload = {
    billingNo: "3001270751",
    billingDate: "06/10/2569",
    poNo: "-",
    poDate: "29/09/2569",
    salesOrderNo: "100767403",
    salesOrderDate: "30/09/2569",
    deliveryOrderNo: "201660572",
    deliveryOrderDate: "05/10/2569",
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
    pageNo: 1,
    totalPages: 1,
    grossAmount: "2,523.20",
    subtotalExclVat: "2,358.13",
    vatRate: 7.0,
    vatAmount: "165.07",
    netAmount: "2,523.20",
    amountInWords: "(สองพันห้าร้อยยี่สิบสามบาทยี่สิบสตางค์)",
    hasStamp: false,
    stampOrderNo: null,
    stampDate: null,
    hasReceiverSig: true,
    receiverName: "ผู้รับของ",
    receivedDate: "14/10/69",
    hasSenderSig: true,
    senderName: "ภัชรพล",
    sentDate: null,
    authorizedSigner: "นางสาวสารภี จันทะลุน",
    items: [
      {
        lineNo: 1,
        materialCode: "110123960111",
        itemDescription: "CYTISINICLINE TABLETS 1.5 MG 10X10's (CYTISINE GPO)",
        tradeName: null,
        gpuCode: "1297088",
        tpuCode: "1297100",
        totalQty: "4.00",
        unit: "BOX",
        unitPrice: "760.00",
        discount: "516.80-",
        lineAmount: "2,523.20",
        lots: [
          {
            lotNo: "S690081",
            mfgDate: "01/09/2569",
            expDate: "01/09/2571",
            qty: "4.00",
            unit: "BOX",
            unitPrice: "760.00",
            discount: "516.80-",
            lotAmount: "2,523.20",
          },
        ],
      },
    ],
  };

  const normalized = normalizeRawOcrPayload(rawPayload, "/samples/gpo-sample-1.jpg");
  assert.equal(normalized.billingDate, "2026-10-06");
  assert.equal(normalized.receivedDate, "2026-10-14");
  assert.equal(normalized.items[0].discount, 516.8);
  assert.equal(normalized.items[0].lots[0].mfgDate, "2026-09-01");
  assert.equal(normalized.items[0].lots[0].expDate, "2028-09-01");
  assert.equal(normalized.items[0].lots[0].discount, 516.8);
  assert.equal(normalized.grossAmount, 2523.2);

  // Test Case 2: Resilience against missing fields ("undefined" bug) & shifted totals (Billing 3001275083 scenario)
  const partialAiPayload = {
    billingNo: "3001275083",
    billingDate: "16/10/2569",
    salesOrderNo: "100771323",
    deliveryOrderNo: "201666403",
    customerCode: "120000030",
    customerName: "โรงพยาบาลตำรวจ",
    customerTaxId: "0994000161321",
    grossAmount: 0,
    subtotalExclVat: 0,
    vatAmount: 12266.36,
    netAmount: 175233.64,
    items: [
      {
        lineNo: 1,
        materialCode: undefined as unknown as string,
        itemDescription: undefined as unknown as string,
        productCode: "110199990111",
        description: "ALBUMIN HUMAN 20% 50 ML",
        totalQty: 30,
        unit: "BOX",
        lineAmount: 187500,
        lots: [
          {
            lotNo: "I685238",
            mfgDate: "02/09/2568",
            expDate: "02/09/2573",
            qty: 20,
            unit: "BOX",
            unitPrice: 6250,
            discount: 0,
            lotAmount: 125000,
          },
          {
            lotNo: "I685237",
            mfgDate: "01/09/2568",
            expDate: "01/09/2573",
            qty: 10,
            unit: "BOX",
            unitPrice: 6250,
            discount: 0,
            lotAmount: 62500,
          },
        ],
      },
    ],
  } as unknown as RawGpoOcrPayload;

  const dataUri = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/";
  const fixedDoc = normalizeRawOcrPayload(partialAiPayload, dataUri);

  assert.notEqual(fixedDoc.items[0].materialCode, "undefined");
  assert.equal(fixedDoc.items[0].materialCode, "110199990111");
  assert.notEqual(fixedDoc.items[0].itemDescription, "undefined");
  assert.equal(fixedDoc.items[0].itemDescription, "ALBUMIN HUMAN 20% 50 ML");
  assert.equal(fixedDoc.grossAmount, 187500);
  assert.equal(fixedDoc.subtotalExclVat, 175233.64);
  assert.equal(fixedDoc.vatAmount, 12266.36);
  assert.equal(fixedDoc.netAmount, 187500);
  assert.equal(fixedDoc.pages[0].imageUrl, dataUri);

  console.log("  ✓ OCR Raw Payload Normalizer tests passed");
}
