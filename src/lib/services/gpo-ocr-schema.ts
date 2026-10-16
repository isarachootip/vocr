import { Type, type Schema } from "@google/genai";

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
กรุณาสกัดข้อมูลทั้งหมดออกมาเป็น JSON ตามโครงสร้าง Schema ที่กำหนดอย่างเคร่งครัด:
1. ส่วนหัวด้านขวาบน:
   - "หน้า X / Y" -> pageNo, totalPages
   - Billing No., PO No., Sales Order No., Delivery Order No. พร้อม "วันที่:" ด้านขวาที่ตรงกับแต่ละบรรทัด (หากว่างเปล่าให้ส่ง null)
2. ส่วนข้อมูลลูกค้า:
   - customerCode (รหัสลูกค้า), customerName (ชื่อหน่วยงาน/โรงพยาบาล/บริษัท), customerAddress, customerTaxId (เลขประจำตัวผู้เสียภาษี), customerBranch (สาขา)
3. ตารางรายการสินค้า (items[]) และรายการย่อยตาม Lot (lots[]):
   - materialCode คือ รหัสสินค้า (เช่น 111407291111, 110123960111) ห้ามเว้นว่าง
   - itemDescription คือ ชื่อสินค้าหลักในคอลัมน์ชื่อสินค้า
   - สกัด tradeName, gpuCode (ตัวเลขหลัง GPU:), tpuCode (ตัวเลขหลัง TPU:) ออกจากข้อความใต้ชื่อสินค้า
   - หากมี 1 Lot ให้สร้าง 1 รายการใน lots[] โดยใช้ qty, unitPrice, discount, lotAmount เดียวกับบรรทัดหลัก
   - หาก 1 รายการสินค้าแตกออกเป็นหลายบรรทัด Lot (เช่น มีจำนวนรวมขีดเส้นใต้ 30.00 BOX แล้วมีบรรทัดย่อย Lot: I685238 จำนวน 20 BOX และ Lot: I685237 จำนวน 10 BOX) ให้รวมเป็น 1 Item ที่มี totalQty = 30, lineAmount = ผลรวมจำนวนเงินทุก Lot และใส่แต่ละ Lot ลงใน lots[]
4. ส่วนสรุปยอดเงินท้ายตารางด้านขวา (มี 4 บรรทัดเรียงจากบนลงล่าง):
   - บรรทัดที่ 1 "รวมเงิน" -> grossAmount (ต้องเท่ากับผลรวมจำนวนเงินของทุกรายการสินค้า)
   - บรรทัดที่ 2 "มูลค่าที่ไม่รวมภาษี" -> subtotalExclVat (ยอดก่อนบวก VAT 7%)
   - บรรทัดที่ 3 "ภาษีมูลค่าเพิ่ม 7.00 %" -> vatAmount
   - บรรทัดที่ 4 "ยอดชำระเงิน" -> netAmount (= subtotalExclVat + vatAmount)
5. ตรวจสอบตราประทับรับของ (hasStamp, stampOrderNo, stampDate) และลายมือชื่อผู้รับของ/ผู้ส่งของด้านล่างสุด`;

export const GPO_OCR_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  required: ["billingNo", "customerCode", "customerName", "grossAmount", "subtotalExclVat", "vatAmount", "netAmount", "items"],
  properties: {
    billingNo: { type: Type.STRING },
    billingDate: { type: Type.STRING, nullable: true },
    poNo: { type: Type.STRING, nullable: true },
    poDate: { type: Type.STRING, nullable: true },
    salesOrderNo: { type: Type.STRING, nullable: true },
    salesOrderDate: { type: Type.STRING, nullable: true },
    deliveryOrderNo: { type: Type.STRING, nullable: true },
    deliveryOrderDate: { type: Type.STRING, nullable: true },
    budgetType: { type: Type.STRING, nullable: true },
    docTypeCode: { type: Type.STRING, nullable: true },
    customerGroup: { type: Type.STRING, nullable: true },
    customerCode: { type: Type.STRING },
    customerName: { type: Type.STRING },
    customerAddress: { type: Type.STRING, nullable: true },
    customerTaxId: { type: Type.STRING, nullable: true },
    customerBranch: { type: Type.STRING, nullable: true },
    shipToCode: { type: Type.STRING, nullable: true },
    shipToName: { type: Type.STRING, nullable: true },
    shipToAddress: { type: Type.STRING, nullable: true },
    pageNo: { type: Type.INTEGER, nullable: true },
    totalPages: { type: Type.INTEGER, nullable: true },
    grossAmount: { type: Type.NUMBER, description: "ยอด 'รวมเงิน' บรรทัดแรกของสรุปท้ายตาราง" },
    subtotalExclVat: { type: Type.NUMBER, description: "ยอด 'มูลค่าที่ไม่รวมภาษี' บรรทัดที่สองของสรุปท้ายตาราง" },
    vatRate: { type: Type.NUMBER, nullable: true },
    vatAmount: { type: Type.NUMBER, description: "ยอด 'ภาษีมูลค่าเพิ่ม 7.00 %'" },
    netAmount: { type: Type.NUMBER, description: "ยอด 'ยอดชำระเงิน' บรรทัดสุดท้าย (= มูลค่าที่ไม่รวมภาษี + VAT)" },
    amountInWords: { type: Type.STRING, nullable: true },
    hasStamp: { type: Type.BOOLEAN, nullable: true },
    stampOrderNo: { type: Type.STRING, nullable: true },
    stampDate: { type: Type.STRING, nullable: true },
    hasReceiverSig: { type: Type.BOOLEAN, nullable: true },
    receiverName: { type: Type.STRING, nullable: true },
    receivedDate: { type: Type.STRING, nullable: true },
    hasSenderSig: { type: Type.BOOLEAN, nullable: true },
    senderName: { type: Type.STRING, nullable: true },
    sentDate: { type: Type.STRING, nullable: true },
    authorizedSigner: { type: Type.STRING, nullable: true },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["lineNo", "materialCode", "itemDescription", "totalQty", "unit", "lineAmount", "lots"],
        properties: {
          lineNo: { type: Type.INTEGER },
          materialCode: { type: Type.STRING, description: "รหัสสินค้าในคอลัมน์รหัสสินค้า เช่น 111407291111" },
          itemDescription: { type: Type.STRING, description: "ชื่อสินค้าหลักในคอลัมน์ชื่อสินค้า" },
          tradeName: { type: Type.STRING, nullable: true },
          gpuCode: { type: Type.STRING, nullable: true },
          tpuCode: { type: Type.STRING, nullable: true },
          totalQty: { type: Type.NUMBER },
          unit: { type: Type.STRING },
          unitPrice: { type: Type.NUMBER, nullable: true },
          discount: { type: Type.STRING, nullable: true },
          lineAmount: { type: Type.NUMBER },
          lots: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["lotNo", "qty", "unit", "unitPrice", "lotAmount"],
              properties: {
                lotNo: { type: Type.STRING },
                mfgDate: { type: Type.STRING, nullable: true },
                expDate: { type: Type.STRING, nullable: true },
                qty: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                unitPrice: { type: Type.NUMBER },
                discount: { type: Type.STRING, nullable: true },
                lotAmount: { type: Type.NUMBER },
              },
            },
          },
        },
      },
    },
  },
};
