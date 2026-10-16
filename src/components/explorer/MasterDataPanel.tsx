"use client";

import React from "react";
import { Building2, Pill } from "lucide-react";

export interface CustomerMasterRecord {
  id: string;
  customerCode: string;
  name: string;
  address: string;
  taxId: string | null;
  branch: string | null;
  customerGroup: string | null;
  _count: { documents: number };
}

export interface ProductMasterRecord {
  id: string;
  materialCode: string;
  description: string;
  tradeName: string | null;
  gpuCode: string | null;
  tpuCode: string | null;
  defaultUnit: string;
  _count: { items: number };
}

interface MasterDataPanelProps {
  customers: CustomerMasterRecord[];
  products: ProductMasterRecord[];
}

export function MasterDataPanel({ customers, products }: MasterDataPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-700" />
            <h2 className="text-xs font-bold uppercase text-slate-800">
              ฐานข้อมูลลูกค้าสะสมอัตโนมัติ (Customers Master)
            </h2>
          </div>
          <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">
            {customers.length} ราย
          </span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-2">รหัสลูกค้า</th>
              <th className="px-4 py-2">ชื่อหน่วยงาน / บริษัท</th>
              <th className="px-4 py-2">เลขผู้เสียภาษี / สาขา</th>
              <th className="px-4 py-2 text-right">จำนวนบิล</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                  {c.customerCode}
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-semibold text-slate-900">{c.name}</div>
                  <div className="text-[11px] text-slate-500">{c.address}</div>
                </td>
                <td className="px-4 py-2.5 text-[11px] text-slate-600">
                  <div>{c.taxId ?? "-"}</div>
                  <div>สาขา: {c.branch ?? "-"}</div>
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-teal-700">
                  {c._count.documents}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-teal-700" />
            <h2 className="text-xs font-bold uppercase text-slate-800">
              ฐานข้อมูลยาและเวชภัณฑ์สะสม (Products & GPU/TPU Master)
            </h2>
          </div>
          <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">
            {products.length} รายการ
          </span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-2">รหัสสินค้า</th>
              <th className="px-4 py-2">ชื่อยา / Trade Name</th>
              <th className="px-4 py-2">GPU / TPU</th>
              <th className="px-4 py-2 text-right">หน่วย</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                  {p.materialCode}
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-semibold text-slate-900">
                    {p.description}
                  </div>
                  {p.tradeName && (
                    <div className="text-[11px] text-teal-700">
                      Trade: {p.tradeName}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">
                  <div>GPU: {p.gpuCode ?? "-"}</div>
                  <div>TPU: {p.tpuCode ?? "-"}</div>
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                  {p.defaultUnit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
