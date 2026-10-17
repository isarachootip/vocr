"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, Loader2, MessageSquare, ArrowRight, Bot } from "lucide-react";
import type { SavedDocumentRecord } from "@/components/explorer/DocumentExplorerView";

interface LineWebhookSimulatorProps {
  onSimulatedSuccess: (doc?: SavedDocumentRecord) => Promise<void>;
  onOpenInWorkspace: (doc: SavedDocumentRecord) => void;
}

interface SimulatedResponse {
  ok?: boolean;
  document?: SavedDocumentRecord;
  aiReply?: { replyText: string; quickReplyItems: Array<{ action: { label: string; text?: string } }> };
  error?: string;
}

export function LineWebhookSimulator({ onSimulatedSuccess, onOpenInWorkspace }: LineWebhookSimulatorProps) {
  const [selectedSample, setSelectedSample] = useState("sample-4");
  const [messageType, setMessageType] = useState<"image" | "file" | "text">("text");
  const [chatText, setChatText] = useState("สวัสดีครับ วันนี้ให้ AI ช่วยเรื่องใดได้บ้าง");
  const [senderName, setSenderName] = useState("ภก. สมชาย (รพ.ตำรวจ)");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<SimulatedResponse | null>(null);

  const handleSimulate = async (overrideText?: string) => {
    setIsSending(true);
    try {
      const textToSend = overrideText ?? chatText;
      if (overrideText) {
        setMessageType("text");
        setChatText(overrideText);
      }
      const res = await fetch("/api/line/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-line-simulator": "1" },
        body: JSON.stringify({ sampleId: selectedSample, senderName, messageType: overrideText ? "text" : messageType, chatText: textToSend }),
      });
      const data = (await res.json()) as SimulatedResponse;
      setLastResult(data);
      if (res.ok) await onSimulatedSuccess(data.document);
    } finally {
      setIsSending(false);
    }
  };

  const doc = lastResult?.document;
  const aiReply = lastResult?.aiReply;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          <span>จำลองการแชททักทาย AI และส่งไฟล์ใบส่งของผ่าน LINE OA (Simulator)</span>
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          ทดสอบการทักแชท AI (ทั้งผู้ใช้ใหม่และผู้ใช้เดิมได้รับข้อความต้อนรับและเมนูเหมือนกัน) และการส่งไฟล์รูปภาพหรือ PDF เข้าสกัด OCR
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">รูปแบบกิจกรรมในแชท LINE</label>
              <select value={messageType} onChange={(e) => setMessageType(e.target.value as "image" | "file" | "text")} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-teal-600 focus:outline-none">
                <option value="text">💬 พิมพ์แชททักทาย / ถาม AI (Text Chat)</option>
                <option value="image">📷 ส่งรูปภาพใบส่งของ (LINE Image)</option>
                <option value="file">📄 แนบไฟล์เอกสาร (PDF File)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">ชื่อผู้ส่งใน LINE (LINE Display Name)</label>
              <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-none" />
            </div>
          </div>

          {messageType === "text" ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">ข้อความที่ผู้ใช้งานพิมพ์ส่งใน LINE</label>
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
                placeholder="พิมพ์ข้อความทักทาย หรือถามข้อมูลใบส่งของ..."
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button type="button" onClick={() => void handleSimulate("สวัสดีครับ วันนี้ทำอะไรได้บ้าง")} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100">👋 ทักทาย AI (ผู้ใช้ใหม่/เดิม)</button>
                <button type="button" onClick={() => void handleSimulate("เช็คสถานะเอกสารล่าสุด")} className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100">🔍 เช็คสถานะเอกสารล่าสุด</button>
                <button type="button" onClick={() => void handleSimulate("ใบส่งของ โรงพยาบาลตำรวจ ยอดเท่าไหร่และมี Lot อะไรบ้าง")} className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-800 hover:bg-indigo-100">💊 ถาม AI ข้อมูลยา รพ.ตำรวจ</button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700">เลือกเอกสารใบส่งของที่ต้องการจำลองส่งผ่านแชท LINE</label>
              <select
                value={selectedSample}
                onChange={(e) => setSelectedSample(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-teal-600 focus:outline-none"
              >
                <option value="sample-4">ใบที่ 4 — Billing 3001275083 (โรงพยาบาลตำรวจ • OSELTAMIVIR 75 mg • 187,500 บาท)</option>
                <option value="sample-3">ใบที่ 3 — Billing 3001275142 (กองแพทย์หลวง • Paracetamol แตก 2 Lot)</option>
                <option value="sample-1">ใบที่ 1 — Billing 3001270751 (CYTISINICLINE 1.5 MG • ส่วนลด 516.80-)</option>
                <option value="sample-2">ใบที่ 2 — Billing 3001270759 (VALSARTAN 160 MG • Trade Name)</option>
              </select>
            </div>
          )}

          <button
            type="button"
            disabled={isSending}
            onClick={() => void handleSimulate()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>{messageType === "text" ? "ส่งข้อความทักแชท AI ใน LINE OA" : "ส่งไฟล์เข้า LINE OA -> สกัด OCR & บันทึกทันที"}</span>
          </button>
        </div>

        <div className="lg:col-span-6">
          {aiReply && !doc ? (
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-slate-50 shadow-sm">
              <div className="flex items-center gap-2 bg-emerald-700 px-4 py-2.5 text-white">
                <Bot className="h-4 w-4 text-emerald-200" />
                <span className="text-xs font-bold">ITE-SERVICE (AI Receptionist Reply)</span>
              </div>
              <div className="space-y-3 bg-white p-4 text-xs">
                <pre className="whitespace-pre-wrap font-sans leading-relaxed text-slate-800">{aiReply.replyText}</pre>
                <div className="border-t border-slate-100 pt-2.5">
                  <div className="mb-1.5 text-[10px] font-bold uppercase text-slate-400">ปุ่มลัด Quick Reply ท้ายแชท LINE:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {aiReply.quickReplyItems.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (item.action.text) void handleSimulate(item.action.text);
                          else setMessageType("image");
                        }}
                        className="rounded-full border border-teal-300 bg-teal-50 px-3 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100"
                      >
                        {item.action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : doc ? (
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-slate-50 shadow-sm">
              <div className="bg-teal-700 px-4 py-3 text-white">
                <div className="text-[10px] font-bold tracking-wider text-teal-200">GPO DELIVERY NOTE OCR (LINE FLEX REPLY)</div>
                <div className="text-sm font-bold">Billing No. {doc.billingNo}</div>
                <div className="text-[11px] text-teal-100">ผู้ส่ง LINE: {doc.lineDisplayName || senderName} | DO: {doc.deliveryOrderNo ?? "-"}</div>
              </div>
              <div className="space-y-2 bg-white p-4 text-xs">
                <div className="font-bold text-slate-900">{doc.customerName}</div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 font-bold">
                  <span className="text-slate-700">ยอดชำระสุทธิ (รวม VAT)</span>
                  <span className="text-sm text-teal-700">{doc.netAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} ฿</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> บันทึก PENDING_REVIEW แล้ว</span>
                  <button type="button" onClick={() => onOpenInWorkspace(doc)} className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal-800">
                    <span>เปิดตรวจสอบใน Tab 1</span> <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
              กดปุ่ม &ldquo;👋 ทักทาย AI (ผู้ใช้ใหม่/เดิม)&rdquo; หรือ &ldquo;ส่งข้อความทักแชท AI&rdquo; ด้านซ้ายเพื่อดูตัวอย่างการโต้ตอบของ AI พร้อมปุ่มลัด Quick Reply
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
