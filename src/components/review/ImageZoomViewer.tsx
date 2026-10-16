"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCcw,
  FileImage,
  Move,
  AlertCircle,
} from "lucide-react";
import type { DocumentPageInput } from "@/lib/schemas/document.schema";

interface ImageZoomViewerProps {
  pages: DocumentPageInput[];
  billingNo: string;
}

export function ImageZoomViewer({ pages, billingNo }: ImageZoomViewerProps) {
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const currentPage = pages[activePageIdx] ?? pages[0];

  useEffect(() => {
    setActivePageIdx(0);
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setImgError(false);
  }, [billingNo, pages]);

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoom((z) => Math.min(4, Math.max(0.5, +(z + delta).toFixed(2))));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex h-full min-h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
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
                  onClick={() => {
                    setActivePageIdx(idx);
                    setImgError(false);
                  }}
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
          <span className="mr-1 hidden items-center gap-1 text-[11px] text-slate-400 sm:inline-flex">
            <Move className="h-3 w-3" /> ลากเพื่อเลื่อนดูภาพ
          </span>
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
            onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
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

      <div
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleReset}
        className={`relative flex-1 overflow-hidden p-4 select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div className="flex min-h-full items-start justify-center">
          {currentPage && !imgError ? (
            <img
              src={currentPage.imageUrl}
              alt={`ใบส่งของ ${billingNo} หน้า ${currentPage.pageNo}`}
              draggable={false}
              onError={() => setImgError(true)}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "top center",
              }}
              className="max-w-full rounded-lg shadow-2xl transition-transform duration-75"
            />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-xs text-slate-400">
              <AlertCircle className="h-6 w-6 text-amber-400" />
              <span>ไม่พบไฟล์ภาพต้นฉบับ หรือกรุณาอัปโหลดรูปภาพใหม่อีกครั้ง</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
