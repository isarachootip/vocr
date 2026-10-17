"use client";

import React from "react";
import { Sparkles, FileCheck2, ArrowRight, Building2, Tag } from "lucide-react";
import type { LineChatConversationRecord } from "@/lib/schemas/line-chat.schema";
import type { SavedDocumentRecord } from "@/components/explorer/DocumentExplorerView";

interface LineChatContextPanelProps {
  conversation: LineChatConversationRecord;
  documents: SavedDocumentRecord[];
  onOpenDocumentInWorkspace: (doc: SavedDocumentRecord) => void;
}

export function LineChatContextPanel({
  conversation,
  documents,
  onOpenDocumentInWorkspace,
}: LineChatContextPanelProps) {
  const msgBillingNos = new Set(
    conversation.messages.map((m) => m.billingNo).filter((b): b is string => Boolean(b))
  );

  const linkedDocs = documents.filter(
    (doc) =>
      msgBillingNos.has(doc.billingNo) ||
      (doc.lineDisplayName &&
        conversation.displayName.toLowerCase().includes(doc.lineDisplayName.toLowerCase())) ||
      (conversation.customerCode && doc.customerCode === conversation.customerCode)
  );

  const totalNet = linkedDocs.reduce((sum, d) => sum + d.netAmount, 0);
  const initials = conversation.displayName.replace(/ภก\.\s*/, "").slice(0, 2).toUpperCase();
  const lastCustomerMsg = [...conversation.messages]
    .reverse()
    .find((m) => m.direction === "INBOUND");

  const aiSummaryText =
    linkedDocs.length > 0
      ? `${conversation.displayName} ส่งไฟล์ใบส่งขององค์การเภสัชกรรมจำนวน ${linkedDocs.length} รายการ (รวมยอดสุทธิ ${totalNet.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท) ขณะนี้รอเจ้าหน้าที่ตรวจสอบความถูกต้องของเลข Lot และลายเซ็นผู้รับของ`
      : `${conversation.displayName} ติดต่อเข้ามาทาง LINE Official Account (ข้อความล่าสุด: "${lastCustomerMsg?.content ?? "ทักทาย"}") สามารถแนะนำให้ลูกค้าส่งรูปถ่ายหรือไฟล์ PDF ใบส่งของเข้ามาเพื่อสกัด OCR อัตโนมัติ`;

  return (
    <aside className="flex h-[740px] flex-col overflow-y-auto border-l border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <span className="text-xs font-extrabold text-slate-700">ข้อมูลจาก CDP & OCR</span>
        <span className="text-[11px] font-bold text-blue-600">GPO Customer 360 ↗</span>
      </div>

      {/* AI Summary Card */}
      <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-900">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> AI Summary
          </span>
          <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 shadow-2xs">
            Auto-Updated
          </span>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-slate-700">{aiSummaryText}</p>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-indigo-100/80 pt-2 text-[11px]">
          <span className="text-slate-500">
            อารมณ์: <strong className="text-emerald-700">● Positive (บวก)</strong>
          </span>
          <span className="text-slate-500">
            ความเร่งด่วน:{" "}
            <strong className="text-amber-700">
              ● {linkedDocs.length > 0 ? "ปานกลาง-สูง" : "ทั่วไป"}
            </strong>
          </span>
        </div>

        <div className="mt-2 space-y-1 text-[11px] text-slate-600">
          <div className="font-bold text-slate-800">สิ่งที่ยังค้าง:</div>
          {linkedDocs.length > 0 ? (
            <ul className="list-inside list-disc space-y-0.5 text-[11px]">
              <li>ตรวจสอบรายการยาและเลข Lot ในหน้า OCR</li>
              <li>ยืนยันสถานะเอกสารเป็น VERIFIED และแจ้งลูกค้า</li>
            </ul>
          ) : (
            <ul className="list-inside list-disc space-y-0.5 text-[11px]">
              <li>ตอบรับข้อความทักทายของลูกค้า</li>
              <li>ขอไฟล์รูปภาพหรือ PDF ใบส่งของเพื่อนำเข้าระบบ</li>
            </ul>
          )}
        </div>

        <div className="mt-2.5 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1.5 text-[11px] text-blue-900">
          <strong>ทำต่อ:</strong>{" "}
          {linkedDocs.length > 0
            ? `เปิดใบส่งของ #${linkedDocs[0].billingNo} ในหน้าตรวจสอบ OCR (Tab 1)`
            : "กดปุ่ม /ทักทายทั่วไป หรือ ✨ แนะนำคำตอบ เพื่อส่งข้อความหาลูกค้า"}
        </div>
      </div>

      {/* Customer Profile */}
      <div className="mt-4 rounded-xl border border-slate-200 p-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-800">
            {initials}
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">{conversation.displayName}</h4>
            <span className="inline-block rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-800">
              {conversation.customerTag || "MEMBER • LINE Live"}
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">รหัสลูกค้า</span>
            <span className="font-mono font-bold text-slate-800">
              {conversation.customerCode || "LINE-DIRECT"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">จำนวนใบส่งของ</span>
            <span className="font-bold text-slate-800">{linkedDocs.length} ใบ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">ยอดรวมสุทธิ</span>
            <span className="font-mono font-extrabold text-teal-700">
              ฿{totalNet.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1 border-t border-slate-100 pt-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
            <Tag className="h-2.5 w-2.5" /> LINE Active
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
            <Building2 className="h-2.5 w-2.5" /> GPO OCR Connected
          </span>
        </div>
      </div>

      {/* Linked Delivery Documents */}
      <div className="mt-4 flex-1 space-y-2">
        <div className="text-xs font-extrabold text-slate-800">
          ใบส่งของที่เชื่อมโยง ({linkedDocs.length})
        </div>
        {linkedDocs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-[11px] text-slate-500">
            ยังไม่มีใบส่งของที่ผูกกับห้องแชทนี้
          </div>
        ) : (
          linkedDocs.map((doc) => (
            <div
              key={doc.billingNo}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs transition hover:border-blue-300 hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-slate-900">
                  Billing #{doc.billingNo}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    doc.status === "VERIFIED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {doc.status}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-600">{doc.customerName}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-teal-700">
                  ฿{doc.netAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenDocumentInWorkspace(doc)}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700"
                >
                  <FileCheck2 className="h-3 w-3" />
                  <span>เปิดตรวจสอบ OCR</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
