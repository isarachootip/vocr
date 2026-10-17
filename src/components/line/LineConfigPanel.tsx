"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Save, RefreshCw, Copy, Check, Eye, EyeOff,
  ExternalLink, CheckCircle2, AlertCircle, MessageCircle,
} from "lucide-react";
import {
  DEFAULT_LINE_CONFIG,
  type LineOaConfigInput,
  type LineBotProfileInfo,
  type LineInboxMessageRecord,
} from "@/lib/schemas/line.schema";
import type { SavedDocumentRecord } from "@/components/explorer/DocumentExplorerView";
import { LineWebhookSimulator } from "./LineWebhookSimulator";
import { LineInboxFeed } from "./LineInboxFeed";

interface LineConfigPanelProps {
  onDocumentReceived: (doc?: SavedDocumentRecord) => Promise<void>;
  onOpenInWorkspace: (doc: SavedDocumentRecord) => void;
  onOpenBillingInWorkspace: (billingNo: string) => void;
}

interface ConnectionState {
  connected: boolean;
  bot?: LineBotProfileInfo;
  error?: string;
}

export function LineConfigPanel({
  onDocumentReceived,
  onOpenInWorkspace,
  onOpenBillingInWorkspace,
}: LineConfigPanelProps) {
  const [form, setForm] = useState<LineOaConfigInput>({
    channelId: DEFAULT_LINE_CONFIG.channelId,
    channelSecret: DEFAULT_LINE_CONFIG.channelSecret,
    channelAccessToken: DEFAULT_LINE_CONFIG.channelAccessToken,
    oaUrl: DEFAULT_LINE_CONFIG.oaUrl,
    isActive: true,
    autoReplyFlex: true,
  });
  const [connection, setConnection] = useState<ConnectionState | null>(null);
  const [inboxMessages, setInboxMessages] = useState<LineInboxMessageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/line/webhook` : "/api/line/webhook";

  const fetchInbox = useCallback(async () => {
    const res = await fetch("/api/line/inbox");
    if (res.ok) {
      const data = (await res.json()) as { messages: LineInboxMessageRecord[] };
      setInboxMessages(data.messages);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cfgRes] = await Promise.all([fetch("/api/line/config?verify=1"), fetchInbox()]);
      if (cfgRes.ok) {
        const data = (await cfgRes.json()) as { config: LineOaConfigInput; connection: ConnectionState | null };
        setForm(data.config);
        setConnection(data.connection);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchInbox]);

  useEffect(() => { void loadConfig(); }, [loadConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/line/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { config?: LineOaConfigInput; connection?: ConnectionState; error?: string };
      if (!res.ok || !data.config) throw new Error(data.error || "บันทึกการตั้งค่าไม่สำเร็จ");
      setForm(data.config);
      if (data.connection) setConnection(data.connection);
      setStatusMsg({ type: "ok", text: "บันทึกการตั้งค่า LINE OA ลงฐานข้อมูลและตรวจสอบสถานะการเชื่อมต่อสำเร็จ!" });
    } catch (err: unknown) {
      setStatusMsg({ type: "err", text: err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm"><MessageCircle className="h-5 w-5" /></div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">ตั้งค่าการเชื่อมต่อ LINE Official Account (Messaging API)</h2>
              <p className="text-xs text-slate-500">รับไฟล์รูปภาพและ PDF ใบส่งของผ่านแชท LINE OA สกัดข้อมูลด้วย Gemini OCR อัตโนมัติ</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {connection?.connected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>เชื่อมต่อ LINE Bot สำเร็จ: {connection.bot?.displayName} {connection.bot?.basicId ? `(${connection.bot.basicId})` : ""}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>{isLoading ? "กำลังตรวจสอบสถานะบอท..." : connection?.error || "รอตรวจสอบการเชื่อมต่อ"}</span>
              </span>
            )}
            <a href={form.oaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100">
              <span>เปิดลิงก์ LINE OA ({form.oaUrl})</span> <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        {statusMsg && (
          <div className={`mt-4 rounded-xl border px-4 py-2.5 text-xs font-semibold ${statusMsg.type === "ok" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-rose-300 bg-rose-50 text-rose-900"}`}>{statusMsg.text}</div>
        )}
        <form onSubmit={(e) => void handleSave(e)} className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">Channel ID</label>
              <input type="text" value={form.channelId} onChange={(e) => setForm({ ...form, channelId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-teal-600 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">LINE OA Add Friend URL</label>
              <input type="url" value={form.oaUrl} onChange={(e) => setForm({ ...form, oaUrl: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-teal-600 focus:outline-none" required />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">Channel Secret</label>
              <div className="relative mt-1">
                <input type={showSecret ? "text" : "password"} value={form.channelSecret} onChange={(e) => setForm({ ...form, channelSecret: e.target.value })} className="w-full rounded-xl border border-slate-300 py-2 pl-3 pr-9 font-mono text-xs text-slate-900 focus:border-teal-600 focus:outline-none" required />
                <button type="button" onClick={() => setShowSecret((p) => !p)} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">{showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Webhook URL (นำไปใส่ใน LINE Developers Console)</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="text" readOnly value={webhookUrl} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700" />
                <button type="button" onClick={() => void handleCopyWebhook()} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  {copiedWebhook ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} <span>{copiedWebhook ? "คัดลอกแล้ว" : "คัดลอก"}</span>
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">Channel Access Token (Long-lived)</label>
            <div className="relative mt-1">
              <input type={showToken ? "text" : "password"} value={form.channelAccessToken} onChange={(e) => setForm({ ...form, channelAccessToken: e.target.value })} className="w-full rounded-xl border border-slate-300 py-2 pl-3 pr-9 font-mono text-xs text-slate-900 focus:border-teal-600 focus:outline-none" required />
              <button type="button" onClick={() => setShowToken((p) => !p)} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">{showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-700">
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-teal-600" /><span>เปิดรับรูปภาพ/PDF ผ่าน LINE Webhook อัตโนมัติ</span></label>
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={form.autoReplyFlex} onChange={(e) => setForm({ ...form, autoReplyFlex: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-teal-600" /><span>ตอบกลับสรุปผล OCR ด้วย LINE Flex Message ทันที</span></label>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => void loadConfig()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" /> <span>ตรวจสอบสถานะ</span></button>
              <button type="submit" disabled={isSaving} className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"><Save className="h-3.5 w-3.5" /> <span>{isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า LINE OA"}</span></button>
            </div>
          </div>
        </form>
      </div>
      <LineWebhookSimulator onSimulatedSuccess={async (doc) => { await fetchInbox(); await onDocumentReceived(doc); }} onOpenInWorkspace={onOpenInWorkspace} />
      <LineInboxFeed messages={inboxMessages} isLoading={isLoading} onRefresh={fetchInbox} onOpenInWorkspace={onOpenBillingInWorkspace} />
    </div>
  );
}
