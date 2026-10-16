"use client";

import React, { useRef } from "react";
import { Upload, Sparkles, Camera, FileCheck2, Loader2 } from "lucide-react";

interface BatchDropzoneProps {
  isExtracting: boolean;
  onUploadFiles: (files: FileList) => Promise<void>;
  onLoadSamples: (sampleIds: string[]) => Promise<void>;
}

export function BatchDropzone({
  isExtracting,
  onUploadFiles,
  onLoadSamples,
}: BatchDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void onUploadFiles(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={isExtracting}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
          >
            {isExtracting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>อัปโหลดรูปใบส่งของ (Batch / หลายใบ)</span>
          </button>

          <button
            type="button"
            disabled={isExtracting}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <Camera className="h-4 w-4 text-slate-600" />
            <span>ถ่ายภาพจากมือถือ</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">
            ทดสอบด้วยเอกสารจริงทั้ง 4 ใบ:
          </span>
          <button
            type="button"
            disabled={isExtracting}
            onClick={() =>
              void onLoadSamples(["sample-1", "sample-2", "sample-3", "sample-4"])
            }
            className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-900 ring-1 ring-amber-500/30 transition hover:bg-amber-500/25 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-700" />
            <span>โหลดทั้ง 4 ใบพร้อมกัน (Batch)</span>
          </button>

          <button
            type="button"
            disabled={isExtracting}
            onClick={() => void onLoadSamples(["sample-1"])}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-teal-600" />
            <span>ใบที่ 1 (ส่วนลด 516.80-)</span>
          </button>

          <button
            type="button"
            disabled={isExtracting}
            onClick={() => void onLoadSamples(["sample-2"])}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-teal-600" />
            <span>ใบที่ 2 (Trade Name)</span>
          </button>

          <button
            type="button"
            disabled={isExtracting}
            onClick={() => void onLoadSamples(["sample-3"])}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-teal-600" />
            <span>ใบที่ 3 (Paracetamol 2 Lot)</span>
          </button>

          <button
            type="button"
            disabled={isExtracting}
            onClick={() => void onLoadSamples(["sample-4"])}
            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>ใบที่ 4 (รพ.ตำรวจ Oseltamivir)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
