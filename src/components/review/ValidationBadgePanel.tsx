"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { ValidationSummary } from "@/lib/schemas/document.schema";

interface ValidationBadgePanelProps {
  validation: ValidationSummary;
}

export function ValidationBadgePanel({
  validation,
}: ValidationBadgePanelProps) {
  const checks = [
    { label: "ผลรวมจำนวน Lot = รายการ", ok: validation.lotQtyMatch },
    { label: "ราคา × จำนวน - ส่วนลด", ok: validation.lineMathMatch },
    { label: "ผลรวมรายการ = รวมเงิน", ok: validation.grossTotalMatch },
    { label: "ฐานภาษี + VAT 7% = สุทธิ", ok: validation.vatReconciled },
    { label: "วันหมดอายุ > วันผลิต", ok: validation.expiryDateValid },
  ];

  return (
    <div
      className={`rounded-2xl border p-3.5 ${
        validation.isValid
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-rose-200 bg-rose-50/60"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {validation.isValid ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <XCircle className="h-5 w-5 text-rose-600" />
          )}
          <span className="text-xs font-bold text-slate-900">
            {validation.isValid
              ? "สมการการเงินและจำนวน Lot ถูกต้องครบถ้วน 100%"
              : "พบจุดที่ตัวเลขไม่ดุลหรือข้อมูลไม่สอดคล้อง กรุณาตรวจสอบก่อนบันทึก"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {checks.map((chk) => (
            <span
              key={chk.label}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                chk.ok
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {chk.ok ? "✓" : "✗"} {chk.label}
            </span>
          ))}
        </div>
      </div>

      {validation.issues.length > 0 && (
        <ul className="mt-2.5 space-y-1 border-t border-slate-200/70 pt-2 text-xs">
          {validation.issues.map((issue, idx) => (
            <li
              key={`${issue.code}-${idx}`}
              className={`flex items-start gap-1.5 ${
                issue.severity === "ERROR"
                  ? "font-medium text-rose-700"
                  : "text-amber-800"
              }`}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
