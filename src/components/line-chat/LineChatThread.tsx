"use client";

import React from "react";
import { CheckCircle2, Lock, FileText, ArrowRight } from "lucide-react";
import type {
  LineChatConversationRecord,
  LineChatStatus,
  QuickReplyTemplate,
} from "@/lib/schemas/line-chat.schema";
import { LineChatComposer } from "./LineChatComposer";

interface LineChatThreadProps {
  conversation: LineChatConversationRecord;
  templates: QuickReplyTemplate[];
  isSending: boolean;
  onSendMessage: (mode: "REPLY" | "PRIVATE_NOTE", content: string) => Promise<void>;
  onUpdateState: (patch: { status?: LineChatStatus; botPaused?: boolean }) => Promise<void>;
  onOpenBillingInWorkspace: (billingNo: string) => void;
}

export function LineChatThread({
  conversation,
  templates,
  isSending,
  onSendMessage,
  onUpdateState,
  onOpenBillingInWorkspace,
}: LineChatThreadProps) {
  return (
    <section className="flex h-[740px] flex-col bg-slate-50/70">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900">{conversation.displayName}</h3>
            <span className="text-xs font-semibold text-emerald-700">LINE • ITE-SERVICE Official</span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              • LINE ID: {conversation.lineUserId.slice(0, 14)}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            มอบหมาย: {conversation.assignedToName || "ทีม Customer Care"} • สถานะ:{" "}
            <span className="font-bold text-slate-700">{conversation.status}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void onUpdateState({ status: "PENDING" })}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
              conversation.status === "PENDING"
                ? "border-amber-400 bg-amber-100 text-amber-900"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() =>
              void onUpdateState({
                status: conversation.status === "RESOLVED" ? "OPEN" : "RESOLVED",
              })
            }
            className={`inline-flex items-center gap-1 rounded-lg px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition ${
              conversation.status === "RESOLVED"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{conversation.status === "RESOLVED" ? "Resolved (เปิดใหม่)" : "Resolve"}</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        <div className="flex justify-center">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-0.5 text-[11px] font-semibold text-slate-500 shadow-2xs">
            วันนี้
          </span>
        </div>

        {conversation.messages.map((msg) => {
          const timeStr = new Date(msg.createdAt).toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          });

          if (msg.direction === "PRIVATE_NOTE") {
            return (
              <div
                key={msg.id}
                className="mx-auto max-w-2xl rounded-xl border border-amber-300 bg-amber-50/95 px-4 py-2.5 text-xs text-amber-950 shadow-2xs"
              >
                <div className="flex items-center justify-between font-bold text-amber-800">
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-3 w-3" /> PRIVATE NOTE - ลูกค้าไม่เห็น
                  </span>
                  <span className="text-[11px]">
                    {timeStr} • {msg.senderName}
                  </span>
                </div>
                <p className="mt-1 leading-relaxed">{msg.content}</p>
              </div>
            );
          }

          if (msg.direction === "INBOUND") {
            return (
              <div key={msg.id} className="flex flex-col items-start">
                <div className="max-w-lg rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-2.5 text-xs leading-relaxed text-slate-800 shadow-2xs">
                  <p className="whitespace-pre-line">{msg.content}</p>
                  {msg.billingNo && (
                    <button
                      type="button"
                      onClick={() => onOpenBillingInWorkspace(msg.billingNo!)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-800 hover:bg-teal-100"
                    >
                      <FileText className="h-3 w-3" />
                      <span>เปิดใบส่งของ Billing #{msg.billingNo} ในหน้า OCR</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <span className="mt-1 px-1 font-mono text-[10px] text-slate-400">{timeStr}</span>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex flex-col items-end">
              <div className="max-w-lg rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-xs leading-relaxed text-white shadow-xs">
                <p className="whitespace-pre-line">{msg.content}</p>
                {msg.billingNo && (
                  <div className="mt-2 rounded-lg bg-blue-700/90 px-2.5 py-1.5 text-[11px] font-semibold text-blue-100">
                    📦 อ้างอิงใบส่งของ Billing #{msg.billingNo}
                  </div>
                )}
              </div>
              <span className="mt-1 px-1 text-[10px] text-slate-400">
                {timeStr} • {msg.senderName}
              </span>
            </div>
          );
        })}
      </div>

      <LineChatComposer
        conversation={conversation}
        templates={templates}
        isSending={isSending}
        onSendMessage={onSendMessage}
        onToggleBotPaused={(botPaused) => onUpdateState({ botPaused })}
      />
    </section>
  );
}
