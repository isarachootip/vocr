"use client";

import React from "react";
import { Save, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import type { DeliveryDocumentInput } from "@/lib/schemas/document.schema";
import { validateDeliveryDocument } from "@/lib/domain/document-validator";
import { ImageZoomViewer } from "./ImageZoomViewer";
import { ValidationBadgePanel } from "./ValidationBadgePanel";
import { HeaderForm } from "./HeaderForm";
import { ItemLotTableEditor } from "./ItemLotTableEditor";

interface ReviewWorkspaceProps {
  queue: DeliveryDocumentInput[];
  activeIdx: number;
  onSelectIdx: (idx: number) => void;
  onUpdateActive: (updated: DeliveryDocumentInput) => void;
  onRemoveFromQueue: (idx: number) => void;
  onSaveDocument: (doc: DeliveryDocumentInput, overwrite: boolean) => Promise<void>;
  isSaving: boolean;
  duplicateBillingNo: string | null;
}

export function ReviewWorkspace({
  queue,
  activeIdx,
  onSelectIdx,
  onUpdateActive,
  onRemoveFromQueue,
  onSaveDocument,
  isSaving,
  duplicateBillingNo,
}: ReviewWorkspaceProps) {
  const activeDoc = queue[activeIdx];
  if (!activeDoc) return null;

  const liveValidation = validateDeliveryDocument(activeDoc);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600">
            คิวรอตรวจสอบ ({queue.length} ใบ):
          </span>
          {queue.map((item, idx) => {
            const v = validateDeliveryDocument(item);
            return (
              <button
                key={`${item.billingNo}-${idx}`}
                type="button"
                onClick={() => onSelectIdx(idx)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  idx === activeIdx
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {v.isValid ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                )}
                <span>Billing #{item.billingNo}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRemoveFromQueue(activeIdx)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <Trash2 className="h-3.5 w-3.5" /> นำออกจากคิว
          </button>

          {duplicateBillingNo === activeDoc.billingNo ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void onSaveDocument(activeDoc, true)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>ยืนยันบันทึกทับ (Overwrite Billing #{activeDoc.billingNo})</span>
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

      <ValidationBadgePanel validation={liveValidation} />

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
