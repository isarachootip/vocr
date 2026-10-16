import type { RawGpoOcrPayload } from "./gpo-prompt";
import { SAMPLE_1_PAYLOAD, SAMPLE_2_PAYLOAD } from "./gpo-samples-data";

export interface GpoSampleEntry {
  id: "sample-1" | "sample-2" | "sample-3";
  title: string;
  subtitle: string;
  imageUrl: string;
  byteLength: number;
  payload: RawGpoOcrPayload;
}

const SAMPLE_3_PAYLOAD: RawGpoOcrPayload = {
  billingNo: "3001275142",
  billingDate: null,
  poNo: "-",
  poDate: null,
  salesOrderNo: "100770924",
  salesOrderDate: null,
  deliveryOrderNo: "201665343",
  deliveryOrderDate: null,
  budgetType: "-",
  docTypeCode: "ZS01/ZB01",
  customerGroup: "2024",
  customerCode: "120000214",
  customerName: "กองแพทย์หลวง สำนักพระราชวัง",
  customerAddress: "ถนนราชวิถี แขวงสวนจิตรลดา เขตดุสิต กรุงเทพมหานคร 10303",
  customerTaxId: "0994000163550",
  customerBranch: "NVAT",
  shipToCode: "120000214",
  shipToName: "กองแพทย์หลวง สำนักพระราชวัง",
  shipToAddress: "ถนนราชวิถี แขวงสวนจิตรลดา เขตดุสิต กรุงเทพมหานคร 10303",
  pageNo: 1,
  totalPages: 1,
  grossAmount: "38,960.00",
  subtotalExclVat: "36,411.21",
  vatRate: 7.0,
  vatAmount: "2,548.79",
  netAmount: "38,960.00",
  amountInWords: "(สามหมื่นแปดพันเก้าร้อยหกสิบบาทถ้วน)",
  hasStamp: true,
  stampOrderNo: "ตราประทับรับของ",
  stampDate: "13/10/69",
  hasReceiverSig: true,
  receiverName: "ผู้รับของ (กองแพทย์หลวง)",
  receivedDate: "13/10/69",
  hasSenderSig: true,
  senderName: "นราธร",
  sentDate: null,
  authorizedSigner: "นางสาวสารภี จันทะลุน",
  items: [
    {
      lineNo: 1,
      materialCode: "111407291111",
      itemDescription: "PARACETAMOL TABLETS 500 MG 50x10's (PARA GPO)",
      tradeName: null,
      gpuCode: "747145",
      tpuCode: "402653",
      totalQty: 40.0,
      unit: "BOX",
      unitPrice: 225.0,
      discount: 0,
      lineAmount: 9000.0,
      lots: [
        {
          lotNo: "Q-606",
          mfgDate: "04/02/2569",
          expDate: "04/02/2573",
          qty: 24.0,
          unit: "BOX",
          unitPrice: 225.0,
          discount: 0,
          lotAmount: 5400.0,
        },
        {
          lotNo: "Q-605",
          mfgDate: "03/02/2569",
          expDate: "03/02/2573",
          qty: 16.0,
          unit: "BOX",
          unitPrice: 225.0,
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
      totalQty: 2000.0,
      unit: "BT",
      unitPrice: 14.98,
      discount: 0,
      lineAmount: 29960.0,
      lots: [
        {
          lotNo: "A690029",
          mfgDate: "11/05/2569",
          expDate: "11/05/2573",
          qty: 2000.0,
          unit: "BT",
          unitPrice: 14.98,
          discount: 0,
          lotAmount: 29960.0,
        },
      ],
    },
  ],
};

export const GPO_SAMPLE_DOCUMENTS: GpoSampleEntry[] = [
  {
    id: "sample-1",
    title: "ใบส่งของ #1 — Billing 3001270751",
    subtitle: "CYTISINICLINE 1.5 MG (1 รายการ, มีส่วนลด 516.80-)",
    imageUrl: "/samples/gpo-sample-1.jpg",
    byteLength: 138170,
    payload: SAMPLE_1_PAYLOAD,
  },
  {
    id: "sample-2",
    title: "ใบส่งของ #2 — Billing 3001270759",
    subtitle: "VALSARTAN 160 MG (มี Trade Name, 10 BOX)",
    imageUrl: "/samples/gpo-sample-2.jpg",
    byteLength: 135525,
    payload: SAMPLE_2_PAYLOAD,
  },
  {
    id: "sample-3",
    title: "ใบส่งของ #3 — Billing 3001275142",
    subtitle: "กองแพทย์หลวง (2 รายการ, Paracetamol แตก 2 Lot + ตราประทับ)",
    imageUrl: "/samples/gpo-sample-3.jpg",
    byteLength: 132780,
    payload: SAMPLE_3_PAYLOAD,
  },
];

export function findSampleByIdOrSize(
  sampleId?: string | null,
  byteLength?: number,
  fileName?: string
): GpoSampleEntry | undefined {
  if (sampleId) {
    const byId = GPO_SAMPLE_DOCUMENTS.find((s) => s.id === sampleId);
    if (byId) return byId;
  }
  if (byteLength) {
    const bySize = GPO_SAMPLE_DOCUMENTS.find((s) => s.byteLength === byteLength);
    if (bySize) return bySize;
  }
  if (fileName) {
    const lower = fileName.toLowerCase();
    if (lower.includes("9c4fe502") || lower.includes("sample-1")) return GPO_SAMPLE_DOCUMENTS[0];
    if (lower.includes("c89c54e5") || lower.includes("sample-2")) return GPO_SAMPLE_DOCUMENTS[1];
    if (lower.includes("8ab72411") || lower.includes("sample-3")) return GPO_SAMPLE_DOCUMENTS[2];
  }
  return undefined;
}
