"use client";

import React from "react";
import { Search, Bot, UserCheck } from "lucide-react";
import type {
  LineChatConversationRecord,
  LineChatStatus,
} from "@/lib/schemas/line-chat.schema";

export type AssignmentFilter = "ALL" | "MINE" | "UNASSIGNED";

interface LineChatSidebarProps {
  conversations: LineChatConversationRecord[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  statusFilter: LineChatStatus | "ALL";
  onStatusFilterChange: (val: LineChatStatus | "ALL") => void;
  assignmentFilter: AssignmentFilter;
  onAssignmentFilterChange: (val: AssignmentFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
}

export function LineChatSidebar({
  conversations,
  activeId,
  onSelectConversation,
  statusFilter,
  onStatusFilterChange,
  assignmentFilter,
  onAssignmentFilterChange,
  searchQuery,
  onSearchQueryChange,
}: LineChatSidebarProps) {
  const mineCount = conversations.filter(
    (c) => c.assignedToName && !c.assignedToName.includes("Unassigned")
  ).length;
  const unassignedCount = conversations.length - mineCount;

  const filtered = conversations.filter((conv) => {
    if (statusFilter !== "ALL" && conv.status !== statusFilter) return false;
    const isUnassigned = !conv.assignedToName || conv.assignedToName.includes("Unassigned");
    if (assignmentFilter === "MINE" && isUnassigned) return false;
    if (assignmentFilter === "UNASSIGNED" && !isUnassigned) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const lastMsg = conv.messages[conv.messages.length - 1]?.content ?? "";
      const hay = `${conv.displayName} ${conv.customerCode ?? ""} ${conv.customerTag ?? ""} ${lastMsg}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <aside className="flex h-[740px] flex-col border-r border-slate-200 bg-white">
      <div className="space-y-2.5 border-b border-slate-100 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-slate-900">Inbox</h2>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as LineChatStatus | "ALL")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="OPEN">สถานะ: Open</option>
            <option value="PENDING">สถานะ: Pending</option>
            <option value="RESOLVED">สถานะ: Resolved</option>
            <option value="ALL">สถานะ: ทั้งหมด</option>
          </select>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="ค้นหาข้อความ / ชื่อลูกค้า..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => onAssignmentFilterChange("MINE")}
            className={`rounded-md py-1 transition ${
              assignmentFilter === "MINE"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Mine {mineCount}
          </button>
          <button
            type="button"
            onClick={() => onAssignmentFilterChange("UNASSIGNED")}
            className={`rounded-md py-1 transition ${
              assignmentFilter === "UNASSIGNED"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Unassigned {unassignedCount}
          </button>
          <button
            type="button"
            onClick={() => onAssignmentFilterChange("ALL")}
            className={`rounded-md py-1 transition ${
              assignmentFilter === "ALL"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All {conversations.length}
          </button>
        </div>
      </div>

      <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            ไม่พบห้องสนทนาตามตัวกรองที่เลือก
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv.id === activeId;
            const lastMsg = conv.messages[conv.messages.length - 1];
            const initials = conv.displayName.replace(/ภก\.\s*/, "").slice(0, 2).toUpperCase();
            const timeStr = new Date(conv.lastMessageAt).toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className={`flex w-full items-start gap-2.5 px-3.5 py-3 text-left transition ${
                  isActive ? "bg-blue-50/80" : "hover:bg-slate-50"
                }`}
              >
                <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-800">
                  {initials}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white ring-2 ring-white">
                    L
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-bold text-slate-900">
                      {conv.displayName}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-slate-400">
                      {timeStr}
                    </span>
                  </div>

                  <p className="mt-0.5 truncate text-[11px] text-slate-600">
                    {lastMsg ? lastMsg.content : "ยังไม่มีข้อความ"}
                  </p>

                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {conv.customerTag || "LINE Live"}
                      </span>
                      {conv.botPaused ? (
                        <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          <UserCheck className="h-2.5 w-2.5" /> แอดมินดูแล
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <Bot className="h-2.5 w-2.5" /> AI Active
                        </span>
                      )}
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
