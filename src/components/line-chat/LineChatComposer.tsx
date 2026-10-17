"use client";

import React, { useState } from "react";
import { Lock, Send, Sparkles, Bot, PauseCircle } from "lucide-react";
import type {
  LineChatConversationRecord,
  QuickReplyTemplate,
} from "@/lib/schemas/line-chat.schema";

interface LineChatComposerProps {
  conversation: LineChatConversationRecord;
  templates: QuickReplyTemplate[];
  isSending: boolean;
  onSendMessage: (mode: "REPLY" | "PRIVATE_NOTE", content: string) => Promise<void>;
  onToggleBotPaused: (botPaused: boolean) => Promise<void>;
}

export function LineChatComposer({
  conversation,
  templates,
  isSending,
  onSendMessage,
  onToggleBotPaused,
}: LineChatComposerProps) {
  const [composerMode, setComposerMode] = useState<"REPLY" | "PRIVATE_NOTE">("REPLY");
  const [tplCategory, setTplCategory] = useState<"ALL" | "GREETING" | "QUESTION" | "ANSWER">("ALL");
  const [draft, setDraft] = useState("");

  const visibleTemplates = templates.filter(
    (t) => tplCategory === "ALL" || t.category === tplCategory
  );

  const handleAiSuggest = () => {
    const lastInbound = [...conversation.messages]
      .reverse()
      .find((m) => m.direction === "INBOUND");
    const linkedBilling = conversation.messages.find((m) => m.billingNo)?.billingNo;

    if (linkedBilling) {
      setDraft(
        `สวัสดีค่ะคุณ ${conversation.displayName} เจ้าหน้าที่ตรวจสอบใบส่งของเลขที่ Billing #${linkedBilling} เรียบร้อยแล้ว ข้อมูลรายการยาและเลขที่ผลิต (Lot No.) ถูกต้องครบถ้วน พร้อมรับเข้าคลังได้ทันทีค่ะ 📄✅`
      );
    } else if (lastInbound?.content.includes("ทักทาย") || lastInbound?.content.includes("สวัสดี")) {
      setDraft(
        `สวัสดีค่ะคุณ ${conversation.displayName} ยินดีต้อนรับสู่ ITE-SERVICE ค่ะ สามารถส่งรูปถ่ายหรือไฟล์ PDF ใบส่งขององค์การเภสัชกรรมเข้ามาในแชทนี้เพื่อให้ระบบสกัดข้อมูลอัตโนมัติได้เลยนะคะ 😊`
      );
    } else {
      setDraft(
        `สวัสดีค่ะคุณ ${conversation.displayName} เจ้าหน้าที่ได้รับข้อความแล้ว กำลังตรวจสอบข้อมูลใบส่งของให้สักครู่นะคะ 🙏`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || isSending) return;
    const text = draft.trim();
    setDraft("");
    await onSendMessage(composerMode, text);
  };

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => setComposerMode("REPLY")}
            className={`border-b-2 pb-1 transition ${
              composerMode === "REPLY"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            ตอบกลับ
          </button>
          <button
            type="button"
            onClick={() => setComposerMode("PRIVATE_NOTE")}
            className={`inline-flex items-center gap-1 border-b-2 pb-1 transition ${
              composerMode === "PRIVATE_NOTE"
                ? "border-amber-500 text-amber-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Lock className="h-3 w-3" /> Private note
          </button>
        </div>

        <button
          type="button"
          onClick={() => void onToggleBotPaused(!conversation.botPaused)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition ${
            conversation.botPaused
              ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
              : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          }`}
        >
          {conversation.botPaused ? (
            <>
              <PauseCircle className="h-3 w-3 text-amber-600" />
              <span>Bot Paused (แอดมินดูแล)</span>
            </>
          ) : (
            <>
              <Bot className="h-3 w-3 text-emerald-600" />
              <span>AI Bot Active (ตอบอัตโนมัติ)</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {(["ALL", "GREETING", "QUESTION", "ANSWER"] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setTplCategory(cat)}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
              tplCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat === "ALL"
              ? "ทั้งหมด"
              : cat === "GREETING"
              ? "👋 Greeting (ทักทาย)"
              : cat === "QUESTION"
              ? "❓ Question (คำถาม)"
              : "💡 Answer (คำตอบ)"}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {visibleTemplates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => setDraft(tpl.content)}
            className="rounded-md border border-blue-200 bg-blue-50/60 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
          >
            {tpl.slashCommand}
          </button>
        ))}
        <button
          type="button"
          onClick={handleAiSuggest}
          className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
        >
          <Sparkles className="h-3 w-3" /> แนะนำคำตอบ
        </button>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-2 flex items-end gap-2">
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            composerMode === "PRIVATE_NOTE"
              ? "พิมพ์บันทึกช่วยจำภายในทีม (ลูกค้าใน LINE จะไม่เห็นข้อความนี้)..."
              : "พิมพ์ข้อความตอบกลับลูกค้า หรือคลิกปุ่ม / ด้านบนเพื่อเลือกข้อความสำเร็จรูป..."
          }
          className={`w-full resize-none rounded-xl border px-3 py-2 text-xs focus:outline-none ${
            composerMode === "PRIVATE_NOTE"
              ? "border-amber-300 bg-amber-50/50 text-amber-950 focus:border-amber-500"
              : "border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-600 focus:bg-white"
          }`}
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 ${
            composerMode === "PRIVATE_NOTE"
              ? "bg-amber-600 hover:bg-amber-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <span>{composerMode === "PRIVATE_NOTE" ? "บันทึกโน้ต" : "ส่ง"}</span>
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
