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

  console.log("  ✓ OCR Raw Payload Normalizer tests passed");
}
