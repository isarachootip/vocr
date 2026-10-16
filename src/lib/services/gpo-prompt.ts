import { normalizeThaiDateToIso } from "../domain/thai-date";
import { parseDocumentNumber, parseTrailingDiscount } from "../domain/number-parser";
import {
  DeliveryDocumentInputSchema,
  type DeliveryDocumentInput,
} from "../schemas/document.schema";

export interface RawGpoLotPayload {
  lotNo: string;
  mfgDate?: string | null;
  expDate?: string | null;
  qty: string | number;
  unit: string;
  unitPrice: string | number;
  discount?: string | number | null;
  lotAmount: string | number;
}

export interface RawGpoItemPayload {
  lineNo: number;
  materialCode: string;
  itemDescription: string;
  tradeName?: string | null;
  gpuCode?: string | null;
  tpuCode?: string | null;
  totalQty: string | number;
  unit: string;
  unitPrice?: string | number | null;
  discount?: string | number | null;
  lineAmount: string | number;
  lots: RawGpoLotPayload[];
}

export interface RawGpoOcrPayload {
  billingNo: string;
  billingDate?: string | null;
  poNo?: string | null;
  poDate?: string | null;
  salesOrderNo?: string | null;
  salesOrderDate?: string | null;
  deliveryOrderNo?: string | null;
  deliveryOrderDate?: string | null;
  budgetType?: string | null;
  docTypeCode?: string | null;
  customerGroup?: string | null;
  customerCode: string;
  customerName: string;
  customerAddress?: string;
  customerTaxId?: string | null;
  customerBranch?: string | null;
  shipToCode?: string | null;
  shipToName?: string | null;
  shipToAddress?: string | null;
  pageNo?: number;
  totalPages?: number;
  grossAmount: string | number;
  subtotalExclVat: string | number;
  vatRate?: string | number;
  vatAmount: string | number;
  netAmount: string | number;
  amountInWords?: string | null;
  hasStamp?: boolean;
  stampOrderNo?: string | null;
  stampDate?: string | null;
  hasReceiverSig?: boolean;
  receiverName?: string | null;
  receivedDate?: string | null;
  hasSenderSig?: boolean;
  senderName?: string | null;
  sentDate?: string | null;
  authorizedSigner?: string | null;
  items: RawGpoItemPayload[];
}

export const GPO_OCR_SYSTEM_PROMPT = `คุณคือระบบ AI ผู้เชี่ยวชาญการอ่าน "ใบส่งของ" ขององค์การเภสัชกรรม (The Government Pharmaceutical Organization - GPO)
กรุณาสกัดข้อมูลทั้งหมดออกมาเป็น JSON ตามโครงสร้าง RawGpoOcrPayload อย่างเคร่งครัด:
1. ด้านขวาบนจะมี "หน้า X / Y" และ "วันที่:" 4 บรรทัดซึ่งตรงกับ Billing No., PO No., Sales Order No., Delivery Order No. ตามลำดับ (หากว่างเปล่าให้ส่ง null)
2. ในตารางรายการสินค้า:
   - หากมี 1 Lot (เช่น Lot: S690081 Mfg: ... Exp: ...) ให้สร้าง 1 รายการใน lots[] โดยใช้ qty, unitPrice, discount, lotAmount เดียวกับบรรทัดหลัก
   - หาก 1 รายการสินค้าแตกออกเป็นหลายบรรทัด Lot (เช่น มีจำนวนรวมขีดเส้นใต้ 40.00 BOX แล้วมีบรรทัดย่อย Lot: Q-606 จำนวน 24.00 BOX และ Lot: Q-605 จำนวน 16.00 BOX) ให้รวมเป็น 1 Item ที่มี totalQty = 40, lineAmount = ผลรวมจำนวนเงินทุก Lot และใส่แต่ละ Lot ลงใน lots[]
3. สกัด GPU, TPU, Trade Name ออกจากใต้ชื่อสินค้า
4. ส่วนลดที่มีเครื่องหมายลบต่อท้าย เช่น "516.80-" ให้ส่งมาตามจริงหรือเป็นตัวเลขบวก
5. ตรวจสอบตราประทับรับของ (hasStamp, stampOrderNo, stampDate) และลายมือชื่อผู้รับของ/ผู้ส่งของด้านล่างสุด
ตอบกลับเป็น JSON เท่านั้น ห้ามครอบด้วย markdown`;

export function normalizeRawOcrPayload(
  raw: RawGpoOcrPayload,
  imageUrl: string
): DeliveryDocumentInput {
  const normalizedItems = raw.items.map((item, idx) => {
    const lots = item.lots.map((lot) => ({
      lotNo: String(lot.lotNo).trim(),
      mfgDate: normalizeThaiDateToIso(lot.mfgDate),
      expDate: normalizeThaiDateToIso(lot.expDate),
      qty: parseDocumentNumber(lot.qty),
      unit: String(lot.unit || item.unit || "BOX").trim(),
      unitPrice: parseDocumentNumber(lot.unitPrice),
      discount: parseTrailingDiscount(lot.discount),
      lotAmount: parseDocumentNumber(lot.lotAmount),
    }));

    const computedLineAmt =
      parseDocumentNumber(item.lineAmount) ||
      lots.reduce((acc, l) => acc + l.lotAmount, 0);

    return {
      lineNo: item.lineNo || idx + 1,
      materialCode: String(item.materialCode).trim(),
      itemDescription: String(item.itemDescription).trim(),
      tradeName: item.tradeName ? String(item.tradeName).trim() : null,
      gpuCode: item.gpuCode ? String(item.gpuCode).trim() : null,
      tpuCode: item.tpuCode ? String(item.tpuCode).trim() : null,
      totalQty: parseDocumentNumber(item.totalQty),
      unit: String(item.unit || "BOX").trim(),
      unitPrice:
        item.unitPrice !== undefined && item.unitPrice !== null
          ? parseDocumentNumber(item.unitPrice)
          : lots[0]?.unitPrice ?? null,
      discount: parseTrailingDiscount(item.discount),
      lineAmount: computedLineAmt,
      lots,
    };
  });

  const candidate: DeliveryDocumentInput = {
    billingNo: String(raw.billingNo).trim(),
    billingDate: normalizeThaiDateToIso(raw.billingDate),
    poNo: raw.poNo ? String(raw.poNo).trim() : "-",
    poDate: normalizeThaiDateToIso(raw.poDate),
    salesOrderNo: raw.salesOrderNo ? String(raw.salesOrderNo).trim() : null,
    salesOrderDate: normalizeThaiDateToIso(raw.salesOrderDate),
    deliveryOrderNo: raw.deliveryOrderNo ? String(raw.deliveryOrderNo).trim() : null,
    deliveryOrderDate: normalizeThaiDateToIso(raw.deliveryOrderDate),
    budgetType: raw.budgetType ? String(raw.budgetType).trim() : null,
    docTypeCode: raw.docTypeCode ? String(raw.docTypeCode).trim() : "ZS01/ZB01",
    customerGroup: raw.customerGroup ? String(raw.customerGroup).trim() : null,
    customerCode: String(raw.customerCode).trim(),
    customerName: String(raw.customerName).trim(),
    customerAddress: raw.customerAddress ? String(raw.customerAddress).trim() : "",
    customerTaxId: raw.customerTaxId ? String(raw.customerTaxId).trim() : null,
    customerBranch: raw.customerBranch ? String(raw.customerBranch).trim() : null,
    shipToCode: raw.shipToCode ? String(raw.shipToCode).trim() : null,
    shipToName: raw.shipToName ? String(raw.shipToName).trim() : null,
    shipToAddress: raw.shipToAddress ? String(raw.shipToAddress).trim() : null,
    grossAmount: parseDocumentNumber(raw.grossAmount),
    subtotalExclVat: parseDocumentNumber(raw.subtotalExclVat),
    vatRate: raw.vatRate ? parseDocumentNumber(raw.vatRate) : 7.0,
    vatAmount: parseDocumentNumber(raw.vatAmount),
    netAmount: parseDocumentNumber(raw.netAmount),
    amountInWords: raw.amountInWords ? String(raw.amountInWords).trim() : null,
    hasStamp: Boolean(raw.hasStamp),
    stampOrderNo: raw.stampOrderNo ? String(raw.stampOrderNo).trim() : null,
    stampDate: normalizeThaiDateToIso(raw.stampDate),
    hasReceiverSig: Boolean(raw.hasReceiverSig),
    receiverName: raw.receiverName ? String(raw.receiverName).trim() : null,
    receivedDate: normalizeThaiDateToIso(raw.receivedDate),
    hasSenderSig: Boolean(raw.hasSenderSig),
    senderName: raw.senderName ? String(raw.senderName).trim() : null,
    sentDate: normalizeThaiDateToIso(raw.sentDate),
    authorizedSigner: raw.authorizedSigner ? String(raw.authorizedSigner).trim() : null,
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
