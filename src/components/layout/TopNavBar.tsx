"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Database,
  ScanLine,
  KeyRound,
  Users,
  UserCheck,
  LogOut,
  MessageCircle,
  Building2,
} from "lucide-react";
import type { SessionUser, UserRoleType } from "@/lib/schemas/auth.schema";
import {
  getAllowedTabsForRole,
  canManageSystemConfig,
  type AppTab,
} from "@/lib/auth/permissions";

export type ActiveTab = AppTab;

interface TopNavBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  user: SessionUser;
  onLogout: () => Promise<void>;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  queueCount: number;
  savedCount: number;
}

const ROLE_BADGE_STYLE: Record<UserRoleType, string> = {
  SYSADMIN: "bg-purple-100 text-purple-800 border-purple-200",
  ADMIN: "bg-teal-100 text-teal-800 border-teal-200",
  USER: "bg-slate-200 text-slate-700 border-slate-300",
};

export function TopNavBar({
  activeTab,
  onSelectTab,
  user,
  onLogout,
  apiKey,
  onApiKeyChange,
  queueCount,
  savedCount,
}: TopNavBarProps) {
  const [showKeyInput, setShowKeyInput] = useState(false);
  const allowedTabs = getAllowedTabsForRole(user.role);
  const canConfigSystem = canManageSystemConfig(user.role);

  const navItems: Array<{
    tab: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeClass?: string;
    activeClass?: string;
    inactiveClass?: string;
  }> = [
    {
      tab: "WORKSPACE",
      label: "1. สกัด & ตรวจสอบเอกสาร",
      icon: <ScanLine className="h-4 w-4" />,
      badge: queueCount > 0 ? queueCount : undefined,
      badgeClass: "bg-teal-100 text-teal-800",
    },
    {
      tab: "EXPLORER",
      label: "2. คลังใบส่งของ & Export",
      icon: <FileSpreadsheet className="h-4 w-4" />,
      badge: savedCount,
      badgeClass: "bg-slate-200 text-slate-700",
    },
    { tab: "MASTER_DATA", label: "3. ฐานข้อมูลลูกค้า & ยา", icon: <Database className="h-4 w-4" /> },
    { tab: "USERS", label: "4. จัดการผู้ใช้งาน", icon: <Users className="h-4 w-4" /> },
    {
      tab: "LINE_OA",
      label: "5. ตั้งค่า LINE OA",
      icon: <MessageCircle className="h-4 w-4" />,
      activeClass: "bg-emerald-600 text-white shadow-sm",
      inactiveClass: "text-emerald-700 hover:bg-emerald-50",
    },
    { tab: "CONTACT", label: "6. ติดต่อเรา", icon: <Building2 className="h-4 w-4" /> },
  ];

  const visibleNavItems = navItems.filter((item) => allowedTabs.includes(item.tab));

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
            <ScanLine className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">GPO Delivery Note OCR System</h1>
            <p className="text-xs text-slate-500">
              ระบบสกัดข้อมูลใบส่งขององค์การเภสัชกรรม 3 ระดับ (Header • Items • Lots)
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.tab;
            const styleClass = isActive
              ? item.activeClass || "bg-white text-teal-800 shadow-sm"
              : item.inactiveClass || "text-slate-600 hover:text-slate-900";
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => onSelectTab(item.tab)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${styleClass}`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {canConfigSystem && (
            <button
              type="button"
              onClick={() => setShowKeyInput((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <KeyRound className="h-3.5 w-3.5 text-teal-600" />
              <span>{apiKey ? "ตั้งค่า Gemini Key แล้ว" : "Gemini API Key"}</span>
            </button>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
            <UserCheck className="h-3.5 w-3.5 text-teal-700" />
            <span className="font-semibold text-slate-800">{user.username || user.email}</span>
            <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${ROLE_BADGE_STYLE[user.role] || ROLE_BADGE_STYLE.USER}`}>
              {user.role}
            </span>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="ml-1 inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
            >
              <LogOut className="h-3 w-3" />
              <span>ออก</span>
            </button>
          </div>
        </div>
      </div>

      {canConfigSystem && showKeyInput && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
          <div className="mx-auto flex max-w-[1600px] items-center gap-3 text-xs">
            <span className="font-medium text-slate-700">Gemini API Key:</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="AIzaSy..."
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
