"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, RefreshCw, FilePlus2, Send, ExternalLink } from "lucide-react";
import {
  QUICK_REPLY_TEMPLATES,
  type LineChatConversationRecord,
  type LineChatStatus,
  type QuickReplyTemplate,
} from "@/lib/schemas/line-chat.schema";
import type { SavedDocumentRecord } from "@/components/explorer/DocumentExplorerView";
import { LineChatSidebar, type AssignmentFilter } from "./LineChatSidebar";
import { LineChatThread } from "./LineChatThread";
import { LineChatContextPanel } from "./LineChatContextPanel";

interface LineOmnichannelInboxProps {
  currentUserName: string;
  documents: SavedDocumentRecord[];
  onOpenDocumentInWorkspace: (doc: SavedDocumentRecord) => void;
  onOpenBillingInWorkspace: (billingNo: string) => void;
  onRefreshDocuments: () => Promise<void>;
  onUnreadCountChange?: (count: number) => void;
}

export function LineOmnichannelInbox({
  currentUserName,
  documents,
  onOpenDocumentInWorkspace,
  onOpenBillingInWorkspace,
  onRefreshDocuments,
  onUnreadCountChange,
}: LineOmnichannelInboxProps) {
  const [conversations, setConversations] = useState<LineChatConversationRecord[]>([]);
  const [templates, setTemplates] = useState<QuickReplyTemplate[]>(QUICK_REPLY_TEMPLATES);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LineChatStatus | "ALL">("OPEN");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const fetchChatInbox = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/line/chat");
      if (!res.ok) return;
      const data = (await res.json()) as {
        conversations: LineChatConversationRecord[];
        totalUnread: number;
        quickTemplates?: QuickReplyTemplate[];
      };
      setConversations(data.conversations);
      if (data.quickTemplates) setTemplates(data.quickTemplates);
      onUnreadCountChange?.(data.totalUnread);
      setActiveId((prev) => prev || data.conversations[0]?.id || null);
    } finally {
      setIsLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => { void fetchChatInbox(); }, [fetchChatInbox]);

  const activeConversation =
    conversations.find((c) => c.id === activeId) || conversations[0] || null;

  const handleSelectConversation = async (id: string) => {
    setActiveId(id);
    const target = conversations.find((c) => c.id === id);
    if (target && target.unreadCount > 0) {
      await fetch("/api/line/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id, markRead: true }),
      });
      await fetchChatInbox();
    }
  };

  const handleSendMessage = async (mode: "REPLY" | "PRIVATE_NOTE", content: string) => {
    if (!activeConversation) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/line/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          mode,
          content,
          senderName: currentUserName,
        }),
      });
      if (res.ok) await fetchChatInbox();
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateState = async (patch: { status?: LineChatStatus; botPaused?: boolean }) => {
    if (!activeConversation) return;
    const res = await fetch("/api/line/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeConversation.id, ...patch }),
    });
    if (res.ok) await fetchChatInbox();
  };

  const handleSimulateIncoming = async (type: "samran-text" | "somchai-file") => {
    setIsSending(true);
    try {
      const payload =
        type === "samran-text"
          ? {
              senderName: "samran",
              lineUserId: "U_SAMRAN_LINE_LIVE",
              messageType: "text",
              chatText: "สวัสดีครับ ต้องการสอบถามขั้นตอนการส่งใบส่งขององค์การเภสัชกรรมครับ",
            }
          : {
              senderName: "ภก. สมชาย ใจดี (รพ.ตำรวจ)",
              lineUserId: "U_SOMCHAI_POLICE_HOSP",
              messageType: "file",
              sampleId: "sample-4",
            };
      await fetch("/api/line/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-line-simulator": "1" },
        body: JSON.stringify(payload),
      });
      await onRefreshDocuments();
      await fetchChatInbox();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-900">Omnichannel LINE Inbox (สไตล์ CB360)</h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                ● เชื่อมต่อ LINE OA: ITE-SERVICE (2012056909)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              สนทนา 2 ทาง (LINE Push API) • Private Note สีเหลือง • สลับโหมด AI Bot / แอดมินดูแล พร้อมดึงใบส่งของเข้าตรวจสอบทันที
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={isSending} onClick={() => void handleSimulateIncoming("samran-text")} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50">
            <Send className="h-3.5 w-3.5" /> <span>จำลองแชทจากคุณ samran</span>
          </button>
          <button type="button" disabled={isSending} onClick={() => void handleSimulateIncoming("somchai-file")} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-50">
            <FilePlus2 className="h-3.5 w-3.5" /> <span>จำลองส่งใบส่งของ (รพ.ตำรวจ)</span>
          </button>
          <a href="https://lin.ee/zW8Iu4s" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
            <span>เปิด LINE OA</span> <ExternalLink className="h-3 w-3" />
          </a>
          <button type="button" onClick={() => void fetchChatInbox()} className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[310px_1fr_340px]">
        <LineChatSidebar
          conversations={conversations}
          activeId={activeConversation?.id ?? null}
          onSelectConversation={(id) => void handleSelectConversation(id)}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          assignmentFilter={assignmentFilter}
          onAssignmentFilterChange={setAssignmentFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
        {activeConversation ? (
          <>
            <LineChatThread
              conversation={activeConversation}
              templates={templates}
              isSending={isSending}
              onSendMessage={handleSendMessage}
              onUpdateState={handleUpdateState}
              onOpenBillingInWorkspace={onOpenBillingInWorkspace}
            />
            <LineChatContextPanel
              conversation={activeConversation}
              documents={documents}
              onOpenDocumentInWorkspace={onOpenDocumentInWorkspace}
            />
          </>
        ) : (
          <div className="col-span-2 flex h-[740px] items-center justify-center text-xs text-slate-400">
            กำลังโหลดห้องสนทนา LINE Inbox...
          </div>
        )}
      </div>
    </div>
  );
}
