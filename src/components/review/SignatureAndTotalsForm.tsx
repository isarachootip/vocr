"use client";

import React from "react";
import type { DeliveryDocumentInput } from "@/lib/schemas/document.schema";
import {
  formatIsoToThaiDate,
  normalizeThaiDateToIso,
} from "@/lib/domain/thai-date";

interface SignatureAndTotalsFormProps {
  doc: DeliveryDocumentInput;
  onChange: (updated: DeliveryDocumentInput) => void;
}

export function SignatureAndTotalsForm({
  doc,
  onChange,
}: SignatureAndTotalsFormProps) {
  const updateField = <K extends keyof DeliveryDocumentInput>(
    field: K,
    value: DeliveryDocumentInput[K]
  ) => {
    onChange({ ...doc, [field]: value });
  };

  return (
    <div className="space-y-2.5 pt-1">
      <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-slate-50 p-2.5 sm:grid-cols-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600">
            รวมเงิน (Gross)
          </label>
          <input
            type="number"
            step="0.01"
            value={doc.grossAmount}
            onChange={(e) =>
              updateField("grossAmount", Number(e.target.value) || 0)
            }
            className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600">
            มูลค่าไม่รวมภาษี
          </label>
          <input
            type="number"
            step="0.01"
            value={doc.subtotalExclVat}
            onChange={(e) =>
              updateField("subtotalExclVat", Number(e.target.value) || 0)
            }
            className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600">
            ภาษีมูลค่าเพิ่ม 7%
          </label>
          <input
            type="number"
            step="0.01"
            value={doc.vatAmount}
            onChange={(e) =>
              updateField("vatAmount", Number(e.target.value) || 0)
            }
            className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-teal-800">
            ยอดชำระเงินสุทธิ
          </label>
          <input
            type="number"
            step="0.01"
            value={doc.netAmount}
            onChange={(e) =>
              updateField("netAmount", Number(e.target.value) || 0)
            }
            className="mt-0.5 w-full rounded-lg border border-teal-500 bg-white px-2.5 py-1 text-xs font-bold text-teal-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 border-t border-slate-100 pt-2 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-lg border border-slate-200 p-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={doc.hasReceiverSig}
              onChange={(e) => updateField("hasReceiverSig", e.target.checked)}
              className="rounded text-teal-600"
            />
            <span>มีลายเซ็นผู้รับของ</span>
          </label>
          <input
            type="text"
            value={doc.receiverName ?? ""}
            onChange={(e) => updateField("receiverName", e.target.value || null)}
            placeholder="ชื่อผู้รับของ"
            className="rounded border border-slate-200 px-2 py-1 text-xs"
          />
        </div>

        <div className="flex flex-col gap-1 rounded-lg border border-slate-200 p-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={doc.hasSenderSig}
              onChange={(e) => updateField("hasSenderSig", e.target.checked)}
              className="rounded text-teal-600"
            />
            <span>มีลายเซ็นผู้ส่งของ</span>
          </label>
          <input
            type="text"
            value={doc.senderName ?? ""}
            onChange={(e) => updateField("senderName", e.target.value || null)}
            placeholder="ชื่อผู้ส่งของ (เช่น ภัชรพล / นราธร)"
            className="rounded border border-slate-200 px-2 py-1 text-xs"
          />
        </div>

        <div className="flex flex-col gap-1 rounded-lg border border-slate-200 p-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={doc.hasStamp}
              onChange={(e) => updateField("hasStamp", e.target.checked)}
              className="rounded text-teal-600"
            />
            <span>มีตราประทับรับของ</span>
          </label>
          <input
            type="text"
            defaultValue={formatIsoToThaiDate(doc.receivedDate)}
            key={`receivedDate-${doc.billingNo}-${doc.receivedDate ?? "null"}`}
            onBlur={(e) =>
              updateField("receivedDate", normalizeThaiDateToIso(e.target.value))
            }
            placeholder="วันที่รับของ พ.ศ. เช่น 14/10/2569"
            className="rounded border border-slate-200 px-2 py-1 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
