"use client";

import React from "react";
import type { DeliveryDocumentInput } from "@/lib/schemas/document.schema";
import {
  formatIsoToThaiDate,
  normalizeThaiDateToIso,
} from "@/lib/domain/thai-date";
import { SignatureAndTotalsForm } from "./SignatureAndTotalsForm";

interface HeaderFormProps {
  doc: DeliveryDocumentInput;
  onChange: (updated: DeliveryDocumentInput) => void;
}

export function HeaderForm({ doc, onChange }: HeaderFormProps) {
  const updateField = <K extends keyof DeliveryDocumentInput>(
    field: K,
    value: DeliveryDocumentInput[K]
  ) => {
    onChange({ ...doc, [field]: value });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800">
          ส่วนที่ 1: ข้อมูลหัวเอกสาร & ลูกค้า (Level 1 — Header & Signatures)
        </h3>
        <span className="text-[11px] text-slate-500">
          รองรับวันที่ พ.ศ. เช่น 06/10/2569 (แปลงเป็น ค.ศ. ลง DB อัตโนมัติ)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600">
            Billing No. *
          </label>
          <input
            type="text"
            value={doc.billingNo}
            onChange={(e) => updateField("billingNo", e.target.value)}
            className="mt-0.5 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-900"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600">
            วันที่ Billing (พ.ศ. DD/MM/YYYY)
          </label>
          <input
            type="text"
            defaultValue={formatIsoToThaiDate(doc.billingDate)}
            key={`billingDate-${doc.billingNo}-${doc.billingDate ?? "null"}`}
            placeholder="เช่น 06/10/2569 หรือเว้นว่าง"
            onBlur={(e) =>
              updateField("billingDate", normalizeThaiDateToIso(e.target.value))
            }
            className="mt-0.5 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600">
            Sales Order No.
          </label>
          <input
            type="text"
            value={doc.salesOrderNo ?? ""}
            onChange={(e) => updateField("salesOrderNo", e.target.value || null)}
            className="mt-0.5 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600">
            Delivery Order No.
          </label>
          <input
            type="text"
            value={doc.deliveryOrderNo ?? ""}
            onChange={(e) =>
              updateField("deliveryOrderNo", e.target.value || null)
            }
            className="mt-0.5 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600">
            รหัสลูกค้า *
          </label>
          <input
            type="text"
            value={doc.customerCode}
            onChange={(e) => updateField("customerCode", e.target.value)}
            className="mt-0.5 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-900"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-600">
            ชื่อลูกค้า / หน่วยงาน *
          </label>
          <input
            type="text"
            value={doc.customerName}
            onChange={(e) => updateField("customerName", e.target.value)}
            className="mt-0.5 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600">
            เลขผู้เสียภาษี / สาขา
          </label>
          <input
            type="text"
            value={doc.customerTaxId ?? ""}
            onChange={(e) =>
              updateField("customerTaxId", e.target.value || null)
            }
            placeholder="เลขผู้เสียภาษี 13 หลัก"
            className="mt-0.5 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800"
          />
        </div>
      </div>

      <SignatureAndTotalsForm doc={doc} onChange={onChange} />
    </div>
  );
}
