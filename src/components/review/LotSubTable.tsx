"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import type { DocumentLotInput } from "@/lib/schemas/document.schema";
import {
  formatIsoToThaiDate,
  normalizeThaiDateToIso,
} from "@/lib/domain/thai-date";

interface LotSubTableProps {
  lots: DocumentLotInput[];
  onUpdateLot: (lotIdx: number, patch: Partial<DocumentLotInput>) => void;
  onAddLot: () => void;
  onRemoveLot: (lotIdx: number) => void;
}

export function LotSubTable({
  lots,
  onUpdateLot,
  onAddLot,
  onRemoveLot,
}: LotSubTableProps) {
  return (
    <div className="mt-2.5 overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-100 text-[11px] font-semibold text-slate-600">
          <tr>
            <th className="px-2.5 py-1.5">Lot No.</th>
            <th className="px-2.5 py-1.5">วันผลิต (พ.ศ.)</th>
            <th className="px-2.5 py-1.5">วันหมดอายุ (พ.ศ.)</th>
            <th className="px-2.5 py-1.5">จำนวน</th>
            <th className="px-2.5 py-1.5">ราคา/หน่วย</th>
            <th className="px-2.5 py-1.5">ส่วนลด</th>
            <th className="px-2.5 py-1.5">จำนวนเงิน Lot</th>
            <th className="px-2 py-1.5 text-right">
              <button
                type="button"
                onClick={onAddLot}
                className="inline-flex items-center gap-1 rounded bg-teal-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-teal-700"
              >
                <Plus className="h-3 w-3" /> เพิ่ม Lot
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lots.map((lot, lotIdx) => (
            <tr key={`${lot.lotNo}-${lotIdx}`}>
              <td className="px-2 py-1">
                <input
                  type="text"
                  value={lot.lotNo}
                  onChange={(e) =>
                    onUpdateLot(lotIdx, { lotNo: e.target.value })
                  }
                  className="w-24 rounded border border-slate-200 px-1.5 py-0.5 font-mono text-xs font-semibold"
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="text"
                  defaultValue={formatIsoToThaiDate(lot.mfgDate)}
                  key={`mfg-${lot.lotNo}-${lot.mfgDate ?? "null"}`}
                  onBlur={(e) =>
                    onUpdateLot(lotIdx, {
                      mfgDate: normalizeThaiDateToIso(e.target.value),
                    })
                  }
                  className="w-24 rounded border border-slate-200 px-1.5 py-0.5 text-xs"
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="text"
                  defaultValue={formatIsoToThaiDate(lot.expDate)}
                  key={`exp-${lot.lotNo}-${lot.expDate ?? "null"}`}
                  onBlur={(e) =>
                    onUpdateLot(lotIdx, {
                      expDate: normalizeThaiDateToIso(e.target.value),
                    })
                  }
                  className="w-24 rounded border border-slate-200 px-1.5 py-0.5 text-xs"
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="number"
                  step="0.01"
                  value={lot.qty}
                  onChange={(e) =>
                    onUpdateLot(lotIdx, { qty: Number(e.target.value) || 0 })
                  }
                  className="w-20 rounded border border-slate-200 px-1.5 py-0.5 text-xs font-semibold"
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="number"
                  step="0.01"
                  value={lot.unitPrice}
                  onChange={(e) =>
                    onUpdateLot(lotIdx, {
                      unitPrice: Number(e.target.value) || 0,
                    })
                  }
                  className="w-20 rounded border border-slate-200 px-1.5 py-0.5 text-xs"
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="number"
                  step="0.01"
                  value={lot.discount}
                  onChange={(e) =>
                    onUpdateLot(lotIdx, {
                      discount: Number(e.target.value) || 0,
                    })
                  }
                  className="w-20 rounded border border-slate-200 px-1.5 py-0.5 text-xs text-rose-700"
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="number"
                  step="0.01"
                  value={lot.lotAmount}
                  onChange={(e) =>
                    onUpdateLot(lotIdx, {
                      lotAmount: Number(e.target.value) || 0,
                    })
                  }
                  className="w-24 rounded border border-slate-200 px-1.5 py-0.5 text-xs font-bold text-teal-800"
                />
              </td>
              <td className="px-2 py-1 text-right">
                {lots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveLot(lotIdx)}
                    className="rounded p-1 text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
