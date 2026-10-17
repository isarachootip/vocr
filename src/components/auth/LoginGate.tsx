"use client";

import React, { useState } from "react";
import { ScanLine, Lock, User, LogIn, Loader2, Building2, ArrowLeft } from "lucide-react";
import { ContactUsPanel } from "@/components/contact/ContactUsPanel";

interface LoginGateProps {
  onLogin: (username: string, password: string) => Promise<string | null>;
}

export function LoginGate({ onLogin }: LoginGateProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("1234");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const errMsg = await onLogin(username, password);
      if (errMsg) {
        setError(errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (showContact) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-[1400px] space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowContact(false)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4 text-teal-700" />
              <span>กลับไปหน้าเข้าสู่ระบบ</span>
            </button>
          </div>
          <ContactUsPanel canEdit={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-md">
            <ScanLine className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            GPO Delivery Note OCR System
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            กรุณาเข้าสู่ระบบด้วย User และ Password เพื่อใช้งานระบบ
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              ชื่อผู้ใช้งาน (User)
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="เช่น admin"
                className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            <span>เข้าสู่ระบบ</span>
          </button>
        </form>

        <div className="mt-5 rounded-xl bg-slate-50 p-3 text-center text-[11px] text-slate-500">
          บัญชีเริ่มต้น: <span className="font-mono font-bold text-slate-700">admin</span> / รหัสผ่าน:{" "}
          <span className="font-mono font-bold text-slate-700">1234</span>
          <br />
          (สามารถเพิ่ม/แก้ไขรหัสผ่านได้ที่แท็บ &ldquo;4. จัดการผู้ใช้งาน&rdquo; หลังเข้าสู่ระบบ)
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4 text-center">
          <button
            type="button"
            onClick={() => setShowContact(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-2 text-xs font-semibold text-teal-800 transition hover:bg-teal-100"
          >
            <Building2 className="h-4 w-4 text-teal-700" />
            <span>ติดต่อเรา (ITE Compute) • Website / LINE / FB / IG / TikTok</span>
          </button>
        </div>
      </div>
    </div>
  );
}
