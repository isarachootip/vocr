"use client";

import React from "react";
import { Layers } from "lucide-react";
import type {
  DeliveryDocumentInput,
  DocumentItemInput,
  DocumentLotInput,
} from "@/lib/schemas/document.schema";
import { roundCurrency } from "@/lib/domain/number-parser";
import { LotSubTable } from "./LotSubTable";

interface ItemLotTableEditorProps {
  doc: DeliveryDocumentInput;
  onChange: (updated: DeliveryDocumentInput) => void;
}

export function ItemLotTableEditor({ doc, onChange }: ItemLotTableEditorProps) {
  const updateItem = (itemIdx: number, updatedItem: DocumentItemInput) => {
    const nextItems = doc.items.map((it, idx) => (idx === itemIdx ? updatedItem : it));
    onChange({ ...doc, items: nextItems });
  };

  const syncLots = (itemIdx: number, nextLots: DocumentLotInput[]) => {
    const item = doc.items[itemIdx];
    updateItem(itemIdx, {
      ...item,
      totalQty: roundCurrency(nextLots.reduce((a, b) => a + b.qty, 0)),
      lineAmount: roundCurrency(nextLots.reduce((a, b) => a + b.lotAmount, 0)),
      lots: nextLots,
    });
  };

  const updateLot = (itemIdx: number, lotIdx: number, patch: Partial<DocumentLotInput>) => {
    const item = doc.items[itemIdx];
    const nextLots = item.lots.map((lot, idx) => {
      if (idx !== lotIdx) return lot;
      const merged = { ...lot, ...patch };
      if (patch.qty !== undefined || patch.unitPrice !== undefined || patch.discount !== undefined) {
        merged.lotAmount = roundCurrency(merged.qty * merged.unitPrice - merged.discount);
      }
      return merged;
    });
    syncLots(itemIdx, nextLots);
  };

  const addLotToItem = (itemIdx: number) => {
    const item = doc.items[itemIdx];
    const newLot: DocumentLotInput = {
      lotNo: "NEW-LOT",
      mfgDate: null,
      expDate: null,
      qty: 1,
      unit: item.unit,
      unitPrice: item.unitPrice ?? 0,
      discount: 0,
      lotAmount: item.unitPrice ?? 0,
    };
    syncLots(itemIdx, [...item.lots, newLot]);
  };

  const removeLotFromItem = (itemIdx: number, lotIdx: number) => {
    const item = doc.items[itemIdx];
    if (item.lots.length <= 1) return;
    syncLots(itemIdx, item.lots.filter((_, idx) => idx !== lotIdx));
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-teal-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800">
            ส่วนที่ 2 & 3: รายการสินค้าและรายละเอียดแยกตาม Lot (Items & Multi-Lots)
          </h3>
        </div>
        <span className="text-[11px] text-slate-500">
          {doc.items.length} รายการสินค้า • รวม{" "}
          {doc.items.reduce((acc, i) => acc + i.lots.length, 0)} Lot
        </span>
      </div>

      <div className="space-y-4">
        {doc.items.map((item, itemIdx) => (
          <div key={`${item.lineNo}-${itemIdx}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-6">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500">รหัสสินค้า</label>
                <input
                  type="text"
                  value={item.materialCode}
                  onChange={(e) => updateItem(itemIdx, { ...item, materialCode: e.target.value })}
                  className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-mono font-bold text-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-500">ชื่อสินค้า (Description)</label>
                <input
                  type="text"
                  value={item.itemDescription}
                  onChange={(e) => updateItem(itemIdx, { ...item, itemDescription: e.target.value })}
                  className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500">GPU / TPU</label>
                <div className="mt-0.5 flex gap-1">
                  <input
                    type="text"
                    value={item.gpuCode ?? ""}
                    placeholder="GPU"
                    onChange={(e) => updateItem(itemIdx, { ...item, gpuCode: e.target.value || null })}
                    className="w-1/2 rounded border border-slate-300 bg-white px-1.5 py-1 text-[11px]"
                  />
                  <input
                    type="text"
                    value={item.tpuCode ?? ""}
                    placeholder="TPU"
                    onChange={(e) => updateItem(itemIdx, { ...item, tpuCode: e.target.value || null })}
                    className="w-1/2 rounded border border-slate-300 bg-white px-1.5 py-1 text-[11px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500">จำนวนรวม ({item.unit})</label>
                <input
                  type="number"
                  step="0.01"
                  value={item.totalQty}
                  onChange={(e) => updateItem(itemIdx, { ...item, totalQty: Number(e.target.value) || 0 })}
                  className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500">จำนวนเงินรวมรายการ</label>
                <input
                  type="number"
                  step="0.01"
                  value={item.lineAmount}
                  onChange={(e) => updateItem(itemIdx, { ...item, lineAmount: Number(e.target.value) || 0 })}
                  className="mt-0.5 w-full rounded border border-teal-500 bg-white px-2 py-1 text-xs font-bold text-teal-900"
                />
              </div>
            </div>

            <LotSubTable
              lots={item.lots}
              onUpdateLot={(lotIdx, patch) => updateLot(itemIdx, lotIdx, patch)}
              onAddLot={() => addLotToItem(itemIdx)}
              onRemoveLot={(lotIdx) => removeLotFromItem(itemIdx, lotIdx)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
