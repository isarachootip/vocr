"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UserPlus, Pencil, Trash2, Check, X, Eye, EyeOff, Users } from "lucide-react";
import type { UserAccountRecord } from "@/lib/schemas/auth.schema";

export function UserManagementPanel() {
  const [users, setUsers] = useState<UserAccountRecord[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = (await res.json()) as { users: UserAccountRecord[] };
      setUsers(data.users);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername, password: newPassword }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) return setMsg({ type: "err", text: data.error || "เพิ่มผู้ใช้งานไม่สำเร็จ" });
    setNewUsername("");
    setNewPassword("");
    setMsg({ type: "ok", text: `เพิ่มผู้ใช้งาน "${newUsername}" สำเร็จ` });
    await loadUsers();
  };

  const handleSaveEdit = async (id: string) => {
    setMsg(null);
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, username: editUsername, password: editPassword }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) return setMsg({ type: "err", text: data.error || "แก้ไขข้อมูลไม่สำเร็จ" });
    setEditingId(null);
    setMsg({ type: "ok", text: `อัปเดตข้อมูลผู้ใช้งาน "${editUsername}" เรียบร้อยแล้ว` });
    await loadUsers();
  };

  const handleDelete = async (u: UserAccountRecord) => {
    setMsg(null);
    const res = await fetch(`/api/users?id=${u.id}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) return setMsg({ type: "err", text: data.error || "ลบผู้ใช้งานไม่สำเร็จ" });
    setMsg({ type: "ok", text: `ลบผู้ใช้งาน "${u.username}" เรียบร้อยแล้ว` });
    await loadUsers();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900">จัดการผู้ใช้งานระบบ (User / Password CRUD)</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswords((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{showPasswords ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}</span>
          </button>
        </div>

        {msg && (
          <div className={`mb-4 rounded-xl border px-3.5 py-2 text-xs font-semibold ${msg.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">ชื่อผู้ใช้งานใหม่ (User)</label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="เช่น user01"
              className="w-56 rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">รหัสผ่าน (Password)</label>
            <input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="กรอกรหัสผ่าน"
              className="w-56 rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-teal-600 focus:outline-none"
            />
          </div>
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-800">
            <UserPlus className="h-3.5 w-3.5" />
            <span>เพิ่มผู้ใช้งาน</span>
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">ลำดับ</th>
              <th className="px-4 py-3">ชื่อผู้ใช้งาน (User)</th>
              <th className="px-4 py-3">รหัสผ่าน (Password)</th>
              <th className="px-4 py-3 text-right">จัดการ (แก้ไข / ลบ)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u, idx) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {editingId === u.id ? (
                    <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-48 rounded-lg border border-teal-500 px-2.5 py-1 text-xs" />
                  ) : (
                    u.username
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-slate-700">
                  {editingId === u.id ? (
                    <input type="text" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="w-48 rounded-lg border border-teal-500 px-2.5 py-1 text-xs" />
                  ) : showPasswords ? u.password : "••••••••"}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === u.id ? (
                    <div className="inline-flex items-center gap-1.5">
                      <button type="button" onClick={() => void handleSaveEdit(u.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800">
                        <Check className="h-3.5 w-3.5" /> บันทึก
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100">
                        <X className="h-3.5 w-3.5" /> ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5">
                      <button type="button" onClick={() => { setEditingId(u.id); setEditUsername(u.username); setEditPassword(u.password); }} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100">
                        <Pencil className="h-3.5 w-3.5 text-teal-600" /> แก้ไข
                      </button>
                      <button type="button" disabled={users.length <= 1} onClick={() => void handleDelete(u)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-40">
                        <Trash2 className="h-3.5 w-3.5" /> ลบ
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
