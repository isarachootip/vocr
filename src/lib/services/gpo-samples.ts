import type { RawGpoOcrPayload } from "./gpo-prompt";
import { SAMPLE_1_PAYLOAD, SAMPLE_2_PAYLOAD } from "./gpo-samples-data";
import { SAMPLE_3_PAYLOAD, SAMPLE_4_PAYLOAD } from "./gpo-samples-extra";

export interface GpoSampleEntry {
  id: "sample-1" | "sample-2" | "sample-3" | "sample-4";
  title: string;
  subtitle: string;
  imageUrl: string;
  byteLength: number;
  payload: RawGpoOcrPayload;
}

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
  {
    id: "sample-4",
    title: "ใบส่งของ #4 — Billing 3001275083 (LINE OA)",
    subtitle: "โรงพยาบาลตำรวจ (OSELTAMIVIR 75 mg แตก 2 Lot K685238/K685237 ยอด 187,500 บาท)",
    imageUrl: "/samples/gpo-sample-4.jpg",
    byteLength: 143371,
    payload: SAMPLE_4_PAYLOAD,
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
    if (lower.includes("cfb1c5c4") || lower.includes("sample-4")) return GPO_SAMPLE_DOCUMENTS[3];
  }
  return undefined;
}
