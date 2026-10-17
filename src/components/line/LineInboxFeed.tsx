"use client";

import React from "react";
import {
  Inbox,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { LineInboxMessageRecord } from "@/lib/schemas/line.schema";

interface LineInboxFeedProps {
  messages: LineInboxMessageRecord[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onOpenInWorkspace: (billingNo: string) => void;
}

export function LineInboxFeed({
  messages,
  isLoading,
  onRefresh,
  onOpenInWorkspace,
}: LineInboxFeedProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Inbox className="h-4 w-4 text-teal-700" />
            <span>กล่องรับไฟล์/แชทจาก LINE OA (LINE Incoming File & Chat Queue)</span>
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
              {messages.length} รายการ
            </span>
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            เมื่อผู้ใช้งานส่งรูปภาพหรือไฟล์ PDF เข้ามาในแชท LINE OA ระบบจะแสดงรายการที่นี่ สกัด OCR อัตโนมัติ และกดดึงเข้าหน้าตรวจสอบ (Tab 1) ได้ทันที
          </p>
        </div>

        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>รีเฟรชรายการจาก LINE</span>
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500">
          ยังไม่มีประวัติการส่งไฟล์จาก LINE OA — สามารถกดปุ่มจำลองการส่งรูป/PDF ในกล่อง Simulator ด้านบน หรือส่งรูปจริงเข้าแชท LINE OA ได้เลย
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-2.5">เวลาที่รับเข้า</th>
                <th className="px-4 py-2.5">ผู้ส่งในแชท LINE</th>
                <th className="px-4 py-2.5">ประเภทไฟล์ที่ส่ง</th>
                <th className="px-4 py-2.5">สถานะกระบวนการ OCR</th>
                <th className="px-4 py-2.5">ข้อมูลใบส่งของที่สกัดได้</th>
                <th className="px-4 py-2.5 text-right">นำเข้าตรวจสอบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                    {new Date(msg.createdAt).toLocaleString("th-TH")}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {msg.lineDisplayName}
                  </td>
                  <td className="px-4 py-3">
                    {msg.messageType === "file" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                        <FileText className="h-3 w-3" />
                        <span>PDF / FILE ({msg.fileName || "document.pdf"})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        <ImageIcon className="h-3 w-3" />
                        <span>IMAGE ({msg.fileName || "image.jpg"})</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {msg.ocrStatus === "COMPLETED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> สกัด OCR สำเร็จ
                      </span>
                    )}
                    {msg.ocrStatus === "PROCESSING" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                        <Clock className="h-3 w-3 animate-spin" /> กำลังสกัด OCR...
                      </span>
                    )}
                    {msg.ocrStatus === "FAILED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                        <AlertTriangle className="h-3 w-3" /> {msg.ocrError || "สกัดไม่สำเร็จ"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {msg.billingNo ? (
                      <div>
                        <span className="font-mono font-bold text-slate-900">
                          Billing #{msg.billingNo}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {msg.customerName} •{" "}
                          {msg.netAmount?.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          ฿
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {msg.billingNo && (
                      <button
                        type="button"
                        onClick={() => onOpenInWorkspace(msg.billingNo!)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
                      >
                        <span>ดึงเข้าหน้าตรวจสอบ (Tab 1)</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
