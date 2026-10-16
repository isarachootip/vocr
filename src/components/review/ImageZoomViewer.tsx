"use client";

import React, { useState } from "react";
import { ZoomIn, ZoomOut, RotateCw, RefreshCcw, FileImage } from "lucide-react";
import type { DocumentPageInput } from "@/lib/schemas/document.schema";

interface ImageZoomViewerProps {
  pages: DocumentPageInput[];
  billingNo: string;
}

export function ImageZoomViewer({ pages, billingNo }: ImageZoomViewerProps) {
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const currentPage = pages[activePageIdx] ?? pages[0];

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200">
        <div className="flex items-center gap-2">
          <FileImage className="h-4 w-4 text-teal-400" />
          <span className="font-semibold">
            ภาพต้นฉบับ (Billing: {billingNo})
          </span>
          {pages.length > 1 && (
            <div className="flex items-center gap-1 rounded-lg bg-slate-800 p-0.5">
              {pages.map((p, idx) => (
                <button
                  key={p.pageNo}
                  type="button"
                  onClick={() => setActivePageIdx(idx)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                    idx === activePageIdx
                      ? "bg-teal-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  หน้า {p.pageNo}/{p.totalPages}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            title="ซูมออก"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
            className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[46px] text-center text-[11px] font-mono text-slate-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            title="ซูมเข้า"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
            className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="หมุนภาพ 90 องศา"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="รีเซ็ตมุมมอง"
            onClick={handleReset}
            className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto p-4">
        <div className="flex min-h-full items-start justify-center">
          {currentPage ? (
            <img
              src={currentPage.imageUrl}
              alt={`ใบส่งของ ${billingNo} หน้า ${currentPage.pageNo}`}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "top center",
              }}
              className="max-w-full rounded-lg shadow-2xl transition-transform duration-150"
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-xs text-slate-400">
              ไม่มีภาพต้นฉบับ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
