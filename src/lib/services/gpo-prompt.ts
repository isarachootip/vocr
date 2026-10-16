import { normalizeThaiDateToIso } from "../domain/thai-date";
import { parseDocumentNumber, parseTrailingDiscount } from "../domain/number-parser";
import {
  DeliveryDocumentInputSchema,
  type DeliveryDocumentInput,
} from "../schemas/document.schema";
import {
  GPO_OCR_SYSTEM_PROMPT,
  type RawGpoLotPayload,
  type RawGpoItemPayload,
  type RawGpoOcrPayload,
} from "./gpo-ocr-schema";

export {
  GPO_OCR_SYSTEM_PROMPT,
  type RawGpoLotPayload,
  type RawGpoItemPayload,
  type RawGpoOcrPayload,
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pickStr(
  record: Record<string, unknown>,
  keys: string[],
  fallback = ""
): string {
  for (const key of keys) {
    const val = record[key];
    if (val !== undefined && val !== null) {
      const str = String(val).trim();
      if (str && str.toLowerCase() !== "undefined" && str.toLowerCase() !== "null") {
        return str;
      }
    }
  }
  return fallback;
}

function reconcileTotals(
  rawGross: number,
  rawSubtotal: number,
  vatAmount: number,
  rawNet: number,
  itemsSum: number
) {
  const grossAmount = rawGross > 0 ? rawGross : itemsSum;
  let subtotalExclVat = rawSubtotal;
  let netAmount = rawNet > 0 ? rawNet : grossAmount;

  if (subtotalExclVat <= 0 && grossAmount > 0) {
    if (vatAmount > 0 && Math.abs(netAmount + vatAmount - grossAmount) <= 0.05) {
      subtotalExclVat = netAmount;
      netAmount = grossAmount;
    } else if (vatAmount > 0 && Math.abs(netAmount - grossAmount) <= 0.05) {
      subtotalExclVat = round2(netAmount - vatAmount);
    } else {
      subtotalExclVat = round2(grossAmount - vatAmount);
    }
  }

  return { grossAmount, subtotalExclVat, netAmount };
}

export function normalizeRawOcrPayload(
  raw: RawGpoOcrPayload,
  imageUrl: string
): DeliveryDocumentInput {
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const normalizedItems = rawItems.map((item, idx) => {
    const itemRec = item as unknown as Record<string, unknown>;
    const rawLots = Array.isArray(item.lots) ? item.lots : [];
    const lots = rawLots.map((lot) => {
      const lotRec = lot as unknown as Record<string, unknown>;
      return {
        lotNo: pickStr(lotRec, ["lotNo", "lot", "batchNo"], "-"),
        mfgDate: normalizeThaiDateToIso(lot.mfgDate),
        expDate: normalizeThaiDateToIso(lot.expDate),
        qty: parseDocumentNumber(lot.qty),
        unit: pickStr(lotRec, ["unit"], pickStr(itemRec, ["unit"], "BOX")),
        unitPrice: parseDocumentNumber(lot.unitPrice),
        discount: parseTrailingDiscount(lot.discount),
        lotAmount: parseDocumentNumber(lot.lotAmount),
      };
    });

    const computedLineAmt =
      parseDocumentNumber(item.lineAmount) ||
      round2(lots.reduce((acc, l) => acc + l.lotAmount, 0));
    const computedQty =
      parseDocumentNumber(item.totalQty) ||
      round2(lots.reduce((acc, l) => acc + l.qty, 0));

    return {
      lineNo: item.lineNo || idx + 1,
      materialCode: pickStr(itemRec, ["materialCode", "productCode", "itemCode", "code"], "UNKNOWN"),
      itemDescription: pickStr(
        itemRec,
        ["itemDescription", "description", "productName", "itemName"],
        "ไม่ระบุชื่อสินค้า"
      ),
      tradeName: pickStr(itemRec, ["tradeName"]) || null,
      gpuCode: pickStr(itemRec, ["gpuCode", "gpu"]) || null,
      tpuCode: pickStr(itemRec, ["tpuCode", "tpu"]) || null,
      totalQty: computedQty > 0 ? computedQty : 1,
      unit: pickStr(itemRec, ["unit"], lots[0]?.unit || "BOX"),
      unitPrice:
        item.unitPrice !== undefined && item.unitPrice !== null
          ? parseDocumentNumber(item.unitPrice)
          : lots[0]?.unitPrice ?? null,
      discount: parseTrailingDiscount(item.discount),
      lineAmount: computedLineAmt,
      lots,
    };
  });

  const rawRec = raw as unknown as Record<string, unknown>;
  const itemsSum = round2(normalizedItems.reduce((acc, i) => acc + i.lineAmount, 0));
  const vatAmount = parseDocumentNumber(raw.vatAmount);
  const { grossAmount, subtotalExclVat, netAmount } = reconcileTotals(
    parseDocumentNumber(raw.grossAmount),
    parseDocumentNumber(raw.subtotalExclVat),
    vatAmount,
    parseDocumentNumber(raw.netAmount),
    itemsSum
  );

  const candidate: DeliveryDocumentInput = {
    billingNo: pickStr(rawRec, ["billingNo", "invoiceNo"], "UNKNOWN"),
    billingDate: normalizeThaiDateToIso(raw.billingDate),
    poNo: pickStr(rawRec, ["poNo"], "-"),
    poDate: normalizeThaiDateToIso(raw.poDate),
    salesOrderNo: pickStr(rawRec, ["salesOrderNo"]) || null,
    salesOrderDate: normalizeThaiDateToIso(raw.salesOrderDate),
    deliveryOrderNo: pickStr(rawRec, ["deliveryOrderNo"]) || null,
    deliveryOrderDate: normalizeThaiDateToIso(raw.deliveryOrderDate),
    budgetType: pickStr(rawRec, ["budgetType"]) || null,
    docTypeCode: pickStr(rawRec, ["docTypeCode"], "ZS01/ZB01"),
    customerGroup: pickStr(rawRec, ["customerGroup"]) || null,
    customerCode: pickStr(rawRec, ["customerCode"], "-"),
    customerName: pickStr(rawRec, ["customerName"], "-"),
    customerAddress: pickStr(rawRec, ["customerAddress"], ""),
    customerTaxId: pickStr(rawRec, ["customerTaxId"]) || null,
    customerBranch: pickStr(rawRec, ["customerBranch"]) || null,
    shipToCode: pickStr(rawRec, ["shipToCode"]) || null,
    shipToName: pickStr(rawRec, ["shipToName"]) || null,
    shipToAddress: pickStr(rawRec, ["shipToAddress"]) || null,
    grossAmount,
    subtotalExclVat,
    vatRate: raw.vatRate ? parseDocumentNumber(raw.vatRate) : 7.0,
    vatAmount,
    netAmount,
    amountInWords: pickStr(rawRec, ["amountInWords"]) || null,
    hasStamp: Boolean(raw.hasStamp),
    stampOrderNo: pickStr(rawRec, ["stampOrderNo"]) || null,
    stampDate: normalizeThaiDateToIso(raw.stampDate),
    hasReceiverSig: Boolean(raw.hasReceiverSig),
    receiverName: pickStr(rawRec, ["receiverName"]) || null,
    receivedDate: normalizeThaiDateToIso(raw.receivedDate),
    hasSenderSig: Boolean(raw.hasSenderSig),
    senderName: pickStr(rawRec, ["senderName"]) || null,
    sentDate: normalizeThaiDateToIso(raw.sentDate),
    authorizedSigner: pickStr(rawRec, ["authorizedSigner"]) || null,
    status: "PENDING_REVIEW",
    overwriteExisting: false,
    pages: [
      {
        pageNo: raw.pageNo ?? 1,
        totalPages: raw.totalPages ?? 1,
        imageUrl,
      },
    ],
    items: normalizedItems,
  };

  return DeliveryDocumentInputSchema.parse(candidate);
}
