"use client";

import React, { useState } from "react";
import { Search, Download, Eye, Trash2, CheckCircle2, Clock } from "lucide-react";
import type { DeliveryDocumentInput } from "@/lib/schemas/document.schema";
import { formatIsoToThaiDate } from "@/lib/domain/thai-date";

export interface SavedDocumentRecord extends DeliveryDocumentInput {
  id: string;
  createdAt: string;
}

interface DocumentExplorerViewProps {
  documents: SavedDocumentRecord[];
  onRefresh: (query: string) => Promise<void>;
  onInspectDocument: (doc: SavedDocumentRecord) => void;
  onDeleteDocument: (id: string) => Promise<void>;
  canDelete: boolean;
}

export function DocumentExplorerView({
  documents,
  onRefresh,
  onInspectDocument,
  onDeleteDocument,
  canDelete,
}: DocumentExplorerViewProps) {
  const [search, setSearch] = useState("");
  const [lotNo, setLotNo] = useState("");

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (lotNo.trim()) params.set("lotNo", lotNo.trim());
    return params.toString();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void onRefresh(buildQuery());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา Billing No., ลูกค้า, ชื่อยา, รหัสยา..."
              className="w-72 rounded-xl border border-slate-300 py-1.5 pl-9 pr-3 text-xs focus:border-teal-600 focus:outline-none"
            />
          </div>
          <input
            type="text"
            value={lotNo}
            onChange={(e) => setLotNo(e.target.value)}
            placeholder="กรองเลข Lot (เช่น Q-606)"
            className="w-44 rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            ค้นหา
          </button>
        </form>

        <a
          href={`/api/documents/export?${buildQuery()}`}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800"
        >
          <Download className="h-4 w-4" />
          <span>Export Excel / CSV (แยกตาม Lot)</span>
        </a>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Billing No. / DO No.</th>
              <th className="px-4 py-3">วันที่เอกสาร (พ.ศ.)</th>
              <th className="px-4 py-3">ลูกค้า / หน่วยงาน</th>
              <th className="px-4 py-3">รายการยา & Lot</th>
              <th className="px-4 py-3 text-right">ยอดชำระสุทธิ</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  ยังไม่มีใบส่งของในฐานข้อมูล กรุณาอัปโหลดหรือโหลดตัวอย่างในแท็บที่ 1
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                      <span>{doc.billingNo}</span>
                      {doc.sourceChannel === "LINE" && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-sans text-[10px] font-bold text-emerald-800">
                          LINE OA
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      DO: {doc.deliveryOrderNo ?? "-"}
                      {doc.lineDisplayName ? ` • ${doc.lineDisplayName}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatIsoToThaiDate(doc.billingDate) || (
                      <span className="text-amber-700">
                        รับของ: {formatIsoToThaiDate(doc.receivedDate) || "-"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{doc.customerName}</div>
                    <div className="text-[11px] text-slate-500">
                      รหัส: {doc.customerCode} ({doc.customerBranch ?? "-"})
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {doc.items.map((item) => (
                        <div key={item.lineNo} className="text-xs">
                          <span className="font-semibold text-slate-800">{item.itemDescription}</span>{" "}
                          <span className="text-teal-700">({item.totalQty} {item.unit})</span>
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {item.lots.map((l) => (
                              <span
                                key={l.lotNo}
                                className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700"
                              >
                                Lot: {l.lotNo} ({l.qty} {l.unit}, Exp: {formatIsoToThaiDate(l.expDate)})
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-teal-800">
                    {doc.netAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    {doc.status === "VERIFIED" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> ยืนยันแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                        <Clock className="h-3 w-3" /> รอตรวจ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onInspectDocument(doc)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5 text-teal-600" /> ดูรูป/แก้ไข
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => void onDeleteDocument(doc.id)}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
