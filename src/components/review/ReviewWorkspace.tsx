"use client";

import React from "react";
import {
  Save,
  CheckCircle,
  AlertCircle,
  Trash2,
  CheckCheck,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { DeliveryDocumentInput } from "@/lib/schemas/document.schema";
import {
  analyzeQueueItem,
  partitionBatchSaveQueue,
} from "@/lib/domain/queue-manager";
import { ImageZoomViewer } from "./ImageZoomViewer";
import { ValidationBadgePanel } from "./ValidationBadgePanel";
import { HeaderForm } from "./HeaderForm";
import { ItemLotTableEditor } from "./ItemLotTableEditor";

interface ReviewWorkspaceProps {
  queue: DeliveryDocumentInput[];
  activeIdx: number;
  existingBillingNos: ReadonlySet<string>;
  onSelectIdx: (idx: number) => void;
  onUpdateActive: (updated: DeliveryDocumentInput) => void;
  onRemoveFromQueue: (idx: number) => void;
  onClearQueue: () => void;
  onSaveDocument: (doc: DeliveryDocumentInput, overwrite: boolean) => Promise<void>;
  onBatchSaveValid: () => Promise<void>;
  isSaving: boolean;
  duplicateBillingNo: string | null;
}

export function ReviewWorkspace({
  queue,
  activeIdx,
  existingBillingNos,
  onSelectIdx,
  onUpdateActive,
  onRemoveFromQueue,
  onClearQueue,
  onSaveDocument,
  onBatchSaveValid,
  isSaving,
  duplicateBillingNo,
}: ReviewWorkspaceProps) {
  const activeDoc = queue[activeIdx];
  if (!activeDoc) return null;

  const activeAnalysis = analyzeQueueItem(activeDoc, existingBillingNos);
  const { saveable } = partitionBatchSaveQueue(queue, existingBillingNos);
  const isAlreadyInDb =
    activeAnalysis.isDuplicate || duplicateBillingNo === activeDoc.billingNo;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600">
            คิวรอตรวจสอบ ({queue.length} ใบ):
          </span>
          {queue.map((item, idx) => {
            const analysis = analyzeQueueItem(item, existingBillingNos);
            const isSelected = idx === activeIdx;
            return (
              <button
                key={`${item.billingNo}-${idx}`}
                type="button"
                onClick={() => onSelectIdx(idx)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {analysis.isValid ? (
                  <CheckCircle
                    className={`h-3.5 w-3.5 ${
                      isSelected ? "text-emerald-300" : "text-emerald-600"
                    }`}
                  />
                ) : (
                  <AlertCircle
                    className={`h-3.5 w-3.5 ${
                      isSelected ? "text-rose-300" : "text-rose-600"
                    }`}
                  />
                )}
                <span>Billing #{item.billingNo}</span>
                {analysis.isDuplicate && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      isSelected
                        ? "bg-amber-400/25 text-amber-100"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    มีในระบบแล้ว
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onRemoveFromQueue(activeIdx)}
            title="เอาเฉพาะใบนี้ออกจากคิวพักข้อมูลบนหน้าจอ (ไม่กระทบข้อมูลในฐานข้อมูล)"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>ยกเลิกใบนี้ (เอาออกจากคิว)</span>
          </button>

          {queue.length > 1 && (
            <button
              type="button"
              disabled={isSaving}
              onClick={onClearQueue}
              title="ล้างรายการในคิวรอตรวจสอบบนหน้าจอทั้งหมด"
              className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>ล้างคิวทั้งหมด</span>
            </button>
          )}

          {queue.length > 1 && saveable.length > 0 && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void onBatchSaveValid()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              <span>บันทึกใบใหม่ที่ผ่านเกณฑ์ทั้งหมด ({saveable.length} ใบ)</span>
            </button>
          )}

          {isAlreadyInDb ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void onSaveDocument(activeDoc, true)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>
                {isSaving
                  ? "กำลังอัปเดตทับข้อมูลเดิม..."
                  : `ยืนยันบันทึกทับข้อมูลเดิม (Overwrite #${activeDoc.billingNo})`}
              </span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void onSaveDocument(activeDoc, false)}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>
                {isSaving
                  ? "กำลังบันทึกลงฐานข้อมูล..."
                  : "ยืนยันและบันทึกลงฐานข้อมูล PostgreSQL"}
              </span>
            </button>
          )}
        </div>
      </div>

      {isAlreadyInDb && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              ใบส่งของเลขที่ <strong>Billing #{activeDoc.billingNo}</strong> มีบันทึกอยู่ในฐานข้อมูลแล้ว —
              หากคุณแก้ไขข้อมูลและต้องการอัปเดตทับข้อมูลเดิมให้กดปุ่มสีส้ม{" "}
              <strong>&ldquo;ยืนยันบันทึกทับข้อมูลเดิม&rdquo;</strong> หรือหากไม่ต้องการแก้ไขให้กด{" "}
              <strong>&ldquo;ยกเลิกใบนี้ (เอาออกจากคิว)&rdquo;</strong>
            </span>
          </div>
        </div>
      )}

      <ValidationBadgePanel validation={activeAnalysis.validation} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5 lg:h-[780px]">
          <ImageZoomViewer
            pages={activeDoc.pages}
            billingNo={activeDoc.billingNo}
          />
        </div>
        <div className="space-y-4 lg:col-span-7 lg:max-h-[780px] lg:overflow-y-auto lg:pr-1">
          <HeaderForm doc={activeDoc} onChange={onUpdateActive} />
          <ItemLotTableEditor doc={activeDoc} onChange={onUpdateActive} />
        </div>
      </div>
    </div>
  );
}
