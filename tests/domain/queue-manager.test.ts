import assert from "node:assert/strict";
import {
  analyzeQueueItem,
  partitionBatchSaveQueue,
  removeQueueItemAtIndex,
} from "../../src/lib/domain/queue-manager";
import type { DeliveryDocumentInput } from "../../src/lib/schemas/document.schema";

function makeValidDoc(billingNo: string): DeliveryDocumentInput {
  return {
    billingNo,
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
    grossAmount: 1070,
    subtotalExclVat: 1000,
    vatRate: 7,
    vatAmount: 70,
    netAmount: 1070,
    amountInWords: null,
    hasStamp: false,
    stampOrderNo: null,
    stampDate: null,
    hasReceiverSig: true,
    receiverName: "สมชาย",
    receivedDate: null,
    hasSenderSig: true,
    senderName: "ภัชรพล",
    sentDate: null,
    authorizedSigner: null,
    status: "VERIFIED",
    overwriteExisting: false,
    pages: [{ pageNo: 1, totalPages: 1, imageUrl: "/samples/gpo-sample-1.jpg" }],
    items: [
      {
        lineNo: 1,
        materialCode: "1101",
        itemDescription: "DRUG A",
        tradeName: null,
        gpuCode: null,
        tpuCode: null,
        totalQty: 10,
        unit: "BOX",
        unitPrice: 107,
        discount: 0,
        lineAmount: 1070,
        lots: [
          {
            lotNo: "L1",
            mfgDate: "2026-01-01",
            expDate: "2028-01-01",
            qty: 10,
            unit: "BOX",
            unitPrice: 107,
            discount: 0,
            lotAmount: 1070,
          },
        ],
      },
    ],
  };
}

export function runQueueManagerTests(): void {
  const existingSet = new Set(["3001270751"]);
  const docDuplicate = makeValidDoc("3001270751");
  const docNewValid = makeValidDoc("3001270759");
  const docInvalidMath: DeliveryDocumentInput = {
    ...makeValidDoc("3001279999"),
    netAmount: 999999, // mismatch with grossAmount 1070
  };

  // 1. Pre-check duplicate detection & batch save eligibility
  const dupAnalysis = analyzeQueueItem(docDuplicate, existingSet);
  assert.equal(dupAnalysis.isValid, true);
  assert.equal(dupAnalysis.isDuplicate, true);
  assert.equal(dupAnalysis.canBatchSave, false);

  const newAnalysis = analyzeQueueItem(docNewValid, existingSet);
  assert.equal(newAnalysis.isValid, true);
  assert.equal(newAnalysis.isDuplicate, false);
  assert.equal(newAnalysis.canBatchSave, true);

  const invalidAnalysis = analyzeQueueItem(docInvalidMath, existingSet);
  assert.equal(invalidAnalysis.isValid, false);
  assert.equal(invalidAnalysis.isDuplicate, false);
  assert.equal(invalidAnalysis.canBatchSave, false);

  // 2. Partition queue into saveable vs remaining
  const partitioned = partitionBatchSaveQueue(
    [docDuplicate, docNewValid, docInvalidMath],
    existingSet
  );
  assert.equal(partitioned.saveable.length, 1);
  assert.equal(partitioned.saveable[0].billingNo, "3001270759");
  assert.equal(partitioned.remaining.length, 2);
  assert.equal(partitioned.remaining[0].billingNo, "3001270751");
  assert.equal(partitioned.remaining[1].billingNo, "3001279999");

  // 3. Remove item from queue and adjust activeIdx safely
  const afterRemoveLast = removeQueueItemAtIndex(
    [docDuplicate, docNewValid],
    1,
    1
  );
  assert.equal(afterRemoveLast.nextQueue.length, 1);
  assert.equal(afterRemoveLast.nextActiveIdx, 0);

  const afterRemoveSingle = removeQueueItemAtIndex([docDuplicate], 0, 0);
  assert.equal(afterRemoveSingle.nextQueue.length, 0);
  assert.equal(afterRemoveSingle.nextActiveIdx, 0);

  console.log("  ✓ Queue Manager tests passed (Pre-check duplicate, Batch Save partition, Safe queue removal)");
}
