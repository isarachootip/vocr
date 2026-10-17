"use client";

import React from "react";
import { Save, X, Loader2 } from "lucide-react";
import type { ContactProfileInput } from "@/lib/schemas/contact.schema";

interface ContactEditFormProps {
  draft: ContactProfileInput;
  isSaving: boolean;
  onUpdateField: (key: keyof ContactProfileInput, value: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const CONTACT_FORM_FIELDS: Array<[keyof ContactProfileInput, string]> = [
  ["companyName", "ชื่อบริษัท / หน่วยงาน"],
  ["phone", "เบอร์โทรศัพท์"],
  ["email", "อีเมล"],
  ["businessHours", "เวลาทำการ"],
  ["address", "ที่อยู่"],
  ["tagline", "คำอธิบายบริการ"],
  ["websiteLabel", "ชื่อแสดงผล Website"],
  ["websiteUrl", "ลิงก์ Website (URL)"],
  ["lineLabel", "ชื่อบัญชี LINE / LINE ID"],
  ["lineUrl", "ลิงก์ LINE (URL)"],
  ["facebookLabel", "ชื่อเพจ Facebook"],
  ["facebookUrl", "ลิงก์ Facebook (URL)"],
  ["instagramLabel", "ชื่อบัญชี Instagram"],
  ["instagramUrl", "ลิงก์ Instagram (URL)"],
  ["tiktokLabel", "ชื่อบัญชี TikTok"],
  ["tiktokUrl", "ลิงก์ TikTok (URL)"],
];

export function ContactEditForm({
  draft,
  isSaving,
  onUpdateField,
  onCancel,
  onSubmit,
}: ContactEditFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900">
          แก้ไขข้อมูลบริษัทและลิงก์ช่องทางติดต่อ (Website • LINE • FB • IG • TikTok)
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
        >
          <X className="h-3.5 w-3.5" /> ยกเลิก
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
        {CONTACT_FORM_FIELDS.map(([fieldKey, label]) => (
          <div key={fieldKey}>
            <label className="mb-1 block font-semibold text-slate-700">
              {label}
            </label>
            <input
              type="text"
              required
              value={draft[fieldKey]}
              onChange={(e) => onUpdateField(fieldKey, e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span>บันทึกข้อมูลติดต่อ</span>
        </button>
      </div>
    </form>
  );
}
