"use client";

import React, { useState } from "react";
import {
  Send,
  CheckCircle2,
  Loader2,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import type { SavedDocumentRecord } from "@/components/explorer/DocumentExplorerView";

interface LineWebhookSimulatorProps {
  onSimulatedSuccess: (doc: SavedDocumentRecord) => Promise<void>;
}

interface SimulatedResponse {
  ok?: boolean;
  document?: SavedDocumentRecord;
  flexMessage?: {
    altText: string;
    contents: Record<string, unknown>;
  };
  error?: string;
}

export function LineWebhookSimulator({
  onSimulatedSuccess,
}: LineWebhookSimulatorProps) {
  const [selectedSample, setSelectedSample] = useState("sample-4");
  const [senderName, setSenderName] = useState("ภก. สมชาย (รพ.ตำรวจ)");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<SimulatedResponse | null>(null);

  const handleSimulate = async () => {
    setIsSending(true);
    try {
      const res = await fetch("/api/line/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-line-simulator": "1",
        },
        body: JSON.stringify({
          sampleId: selectedSample,
          senderName,
        }),
      });
      const data = (await res.json()) as SimulatedResponse;
      setLastResult(data);
      if (res.ok && data.document) {
        await onSimulatedSuccess(data.document);
      }
    } finally {
      setIsSending(false);
    }
  };

  const doc = lastResult?.document;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            <span>จำลองการส่งรูปใบส่งของเข้า LINE OA Webhook (Simulator)</span>
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            ทดสอบส่งภาพใบส่งของ (เช่น Billing No. 3001275083 โรงพยาบาลตำรวจ) เข้าパイプไลน์ LINE OA เพื่อดูผลลัพธ์การบันทึกและ Flex Message ตอบกลับ
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              เลือกไฟล์ภาพใบส่งของที่ต้องการจำลองส่งผ่าน LINE
            </label>
            <select
              value={selectedSample}
              onChange={(e) => setSelectedSample(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-teal-600 focus:outline-none"
            >
              <option value="sample-4">
                ใบที่ 4 — Billing 3001275083 (โรงพยาบาลตำรวจ • OSELTAMIVIR 75 mg • 187,500 บาท)
              </option>
              <option value="sample-3">
                ใบที่ 3 — Billing 3001275142 (กองแพทย์หลวง • Paracetamol แตก 2 Lot)
              </option>
              <option value="sample-1">
                ใบที่ 1 — Billing 3001270751 (CYTISINICLINE 1.5 MG • ส่วนลด 516.80-)
              </option>
              <option value="sample-2">
                ใบที่ 2 — Billing 3001270759 (VALSARTAN 160 MG • Trade Name)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              ชื่อผู้ส่งใน LINE (LINE Display Name)
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <button
            type="button"
            disabled={isSending}
            onClick={() => void handleSimulate()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>จำลองการส่งรูปเข้า LINE OA และบันทึกเข้าฐานข้อมูลทันที</span>
          </button>
        </div>

        <div className="lg:col-span-6">
          {doc ? (
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-slate-50 shadow-sm">
              <div className="bg-teal-700 px-4 py-3 text-white">
                <div className="text-[10px] font-bold tracking-wider text-teal-200">
                  GPO DELIVERY NOTE OCR (LINE FLEX PREVIEW)
                </div>
                <div className="text-sm font-bold">Billing No. {doc.billingNo}</div>
                <div className="text-[11px] text-teal-100">
                  ผู้ส่ง LINE: {doc.lineDisplayName || senderName} | DO: {doc.deliveryOrderNo ?? "-"}
                </div>
              </div>
              <div className="space-y-2 bg-white p-4 text-xs">
                <div className="font-bold text-slate-900">{doc.customerName}</div>
                <div className="text-[11px] text-slate-500">
                  รหัสลูกค้า: {doc.customerCode} ({doc.customerBranch ?? "-"})
                </div>
                <div className="border-t border-slate-100 pt-2">
                  {doc.items.map((item) => (
                    <div key={item.lineNo} className="mb-1.5">
                      <div className="font-semibold text-slate-800">
                        {item.lineNo}. {item.itemDescription} ({item.totalQty} {item.unit})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.lots.map((l) => `Lot: ${l.lotNo} (${l.qty} ${l.unit})`).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 font-bold">
                  <span className="text-slate-700">ยอดชำระสุทธิ (รวม VAT)</span>
                  <span className="text-sm text-teal-700">
                    {doc.netAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} ฿
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    บันทึกสถานะ PENDING_REVIEW เรียบร้อย
                  </span>
                  <span className="inline-flex items-center gap-1 text-teal-700">
                    <ExternalLink className="h-3 w-3" /> พร้อมตรวจในคลัง
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
              กดปุ่ม &ldquo;จำลองการส่งรูปเข้า LINE OA&rdquo; ด้านซ้ายเพื่อดูตัวอย่าง Flex Message ที่บอทจะตอบกลับผู้ส่งใน LINE
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
