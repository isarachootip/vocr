"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Database,
  ScanLine,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import type { SessionUser, UserRoleType } from "@/lib/schemas/auth.schema";

export type ActiveTab = "WORKSPACE" | "EXPLORER" | "MASTER_DATA";

interface TopNavBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  user: SessionUser;
  onRoleChange: (role: UserRoleType) => Promise<void>;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  queueCount: number;
  savedCount: number;
}

export function TopNavBar({
  activeTab,
  onSelectTab,
  user,
  onRoleChange,
  apiKey,
  onApiKeyChange,
  queueCount,
  savedCount,
}: TopNavBarProps) {
  const [showKeyInput, setShowKeyInput] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
            <ScanLine className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              GPO Delivery Note OCR System
            </h1>
            <p className="text-xs text-slate-500">
              ระบบสกัดข้อมูลใบส่งขององค์การเภสัชกรรม 3 ระดับ (Header • Items • Lots)
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onSelectTab("WORKSPACE")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "WORKSPACE"
                ? "bg-white text-teal-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ScanLine className="h-4 w-4" />
            <span>1. สกัด & ตรวจสอบเอกสาร</span>
            {queueCount > 0 && (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-800">
                {queueCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("EXPLORER")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "EXPLORER"
                ? "bg-white text-teal-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>2. คลังใบส่งของ & Export</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
              {savedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("MASTER_DATA")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === "MASTER_DATA"
                ? "bg-white text-teal-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Database className="h-4 w-4" />
            <span>3. ฐานข้อมูลลูกค้า & ยา (GPU/TPU)</span>
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowKeyInput((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <KeyRound className="h-3.5 w-3.5 text-teal-600" />
            <span>{apiKey ? "ตั้งค่า Gemini Key แล้ว" : "Gemini API Key"}</span>
          </button>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
            <ShieldCheck className="h-4 w-4 text-teal-700" />
            <span className="text-slate-500">สิทธิ์:</span>
            <select
              aria-label="เปลี่ยนสิทธิ์ผู้ใช้งาน"
              value={user.role}
              onChange={(e) => void onRoleChange(e.target.value as UserRoleType)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none"
            >
              <option value="UPLOADER">UPLOADER (อัปโหลดอย่างเดียว)</option>
              <option value="REVIEWER">REVIEWER (ตรวจสอบ/ยืนยันเข้า DB)</option>
              <option value="ADMIN">ADMIN (ผู้ดูแลระบบ)</option>
            </select>
          </div>
        </div>
      </div>

      {showKeyInput && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
          <div className="mx-auto flex max-w-[1600px] items-center gap-3 text-xs">
            <span className="font-medium text-slate-700">
              Gemini API Key (สำหรับสกัดรูปถ่ายใหม่นอกเหนือจากรูปตัวอย่าง 3 ใบ):
            </span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="AIzaSy... (หากเว้นว่างจะใช้ค่าจาก .env หรือ Preset ของรูปตัวอย่าง)"
              className="w-96 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs focus:border-teal-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowKeyInput(false)}
              className="rounded-md bg-teal-700 px-3 py-1 font-medium text-white hover:bg-teal-800"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
