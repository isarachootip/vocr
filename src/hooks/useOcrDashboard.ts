"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { ActiveTab } from "@/components/layout/TopNavBar";
import type { SavedDocumentRecord } from "@/components/explorer/DocumentExplorerView";
import type { CustomerMasterRecord, ProductMasterRecord } from "@/components/explorer/MasterDataPanel";
import type { DeliveryDocumentInput } from "@/lib/schemas/document.schema";
import type { SessionUser } from "@/lib/schemas/auth.schema";
import { partitionBatchSaveQueue, removeQueueItemAtIndex } from "@/lib/domain/queue-manager";

const DEFAULT_GEMINI_KEY = "QVEuQWI4Uk42SzZQUU5HQzZ3Rk5hZnVDUmRBME1TY01yTm9uU1NTejRmYjhOQVRrdGpseUE=";
const GEMINI_KEY_STORAGE = "gpo_ocr_gemini_key";

function getDefaultGeminiKey(): string {
  try {
    return typeof atob === "function" ? atob(DEFAULT_GEMINI_KEY) : Buffer.from(DEFAULT_GEMINI_KEY, "base64").toString("utf-8");
  } catch { return ""; }
}

export function useOcrDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("WORKSPACE");
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SessionUser>({ id: "admin", username: "admin", email: "admin", name: "admin", role: "ADMIN" });
  const [apiKey, setApiKeyState] = useState(getDefaultGeminiKey);
  const [queue, setQueue] = useState<DeliveryDocumentInput[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [duplicateBillingNo, setDuplicateBillingNo] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [savedDocs, setSavedDocs] = useState<SavedDocumentRecord[]>([]);
  const [masterData, setMasterData] = useState<{ customers: CustomerMasterRecord[]; products: ProductMasterRecord[] }>({ customers: [], products: [] });

  const existingBillingNos = useMemo(() => new Set(savedDocs.map((d) => d.billingNo.trim())), [savedDocs]);

  const fetchDocuments = useCallback(async (query = "") => {
    const res = await fetch(`/api/documents${query ? `?${query}` : ""}`);
    if (!res.ok) return;
    const data = (await res.json()) as { documents: SavedDocumentRecord[] };
    setSavedDocs(data.documents);
    if (!query) {
      const pendingLine = data.documents
        .filter((d) => d.sourceChannel === "LINE" && d.status === "PENDING_REVIEW")
        .map((d) => ({ ...d, status: "VERIFIED" as const, overwriteExisting: true }));
      if (pendingLine.length > 0) setQueue((prev) => (prev.length === 0 ? pendingLine : prev));
    }
  }, []);

  const fetchMasterData = useCallback(async () => {
    const res = await fetch("/api/master-data");
    if (res.ok) setMasterData((await res.json()) as { customers: CustomerMasterRecord[]; products: ProductMasterRecord[] });
  }, []);

  const setApiKey = useCallback((nextKey: string) => {
    setApiKeyState(nextKey);
    try { window.localStorage.setItem(GEMINI_KEY_STORAGE, nextKey); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(GEMINI_KEY_STORAGE);
      if (stored && stored.trim()) setApiKeyState(stored.trim());
    } catch { /* ignore */ }
    void fetch("/api/auth")
      .then((r) => r.json())
      .then((d: { authenticated?: boolean; user?: SessionUser | null }) => {
        if (d.authenticated && d.user) { setIsAuthenticated(true); setUser(d.user); }
      })
      .finally(() => setIsAuthChecking(false));
    void fetchDocuments();
    void fetchMasterData();
  }, [fetchDocuments, fetchMasterData]);

  const handleLogin = async (username: string, password: string): Promise<string | null> => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = (await res.json()) as { user?: SessionUser; error?: string };
    if (!res.ok || !data.user) return data.error || "เข้าสู่ระบบไม่สำเร็จ";
    setUser(data.user);
    setIsAuthenticated(true);
    return null;
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setIsAuthenticated(false);
  };

  const handleLoadSamples = async (sampleIds: string[]) => {
    setIsExtracting(true); setBanner(null);
    try {
      const res = await fetch("/api/documents/extract", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleIds, apiKey }),
      });
      const data = (await res.json()) as { results?: Array<{ document: DeliveryDocumentInput }>; error?: string };
      if (!res.ok || !data.results) throw new Error(data.error || "ไม่สามารถโหลดข้อมูลตัวอย่างได้");
      const docs = data.results.map((r) => r.document);
      setQueue((prev) => [...prev, ...docs]); setActiveIdx(queue.length);
      setBanner({ type: "ok", text: `สกัดข้อมูลใบส่งของสำเร็จ ${docs.length} ใบ กรุณาตรวจสอบข้อมูลก่อนกดบันทึกเข้าฐานข้อมูล` });
    } catch (err: unknown) {
      setBanner({ type: "err", text: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" });
    } finally { setIsExtracting(false); }
  };

  const handleUploadFiles = async (files: FileList) => {
    setIsExtracting(true); setBanner(null);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("files", f));
      if (apiKey) form.append("apiKey", apiKey);
      const res = await fetch("/api/documents/extract", { method: "POST", body: form });
      const data = (await res.json()) as { results?: Array<{ document: DeliveryDocumentInput }>; error?: string };
      if (!res.ok || !data.results) throw new Error(data.error || "สกัดข้อมูลจากรูปภาพไม่สำเร็จ");
      const docs = data.results.map((r) => r.document);
      setQueue((prev) => [...prev, ...docs]); setActiveIdx(queue.length);
      setBanner({ type: "ok", text: `อัปโหลดและสกัดข้อมูลสำเร็จ ${docs.length} ใบ` });
    } catch (err: unknown) {
      setBanner({ type: "err", text: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" });
    } finally { setIsExtracting(false); }
  };

  const handleSaveDocument = async (doc: DeliveryDocumentInput, overwrite: boolean) => {
    setIsSaving(true); setBanner(null); setDuplicateBillingNo(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...doc, overwriteExisting: overwrite }),
      });
      const data = (await res.json()) as { error?: string; code?: string };
      if (res.status === 409 && data.code === "DUPLICATE_BILLING_NO") {
        setDuplicateBillingNo(doc.billingNo);
        setBanner({ type: "err", text: `${data.error} — หากต้องการอัปเดตทับข้อมูลเดิม กรุณากดปุ่ม "ยืนยันบันทึกทับข้อมูลเดิม"` });
        return;
      }
      if (!res.ok) throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
      setBanner({ type: "ok", text: `บันทึกใบส่งของ Billing #${doc.billingNo} พร้อมอัปเดต Master Data ลง PostgreSQL สำเร็จ!` });
      const removed = removeQueueItemAtIndex(queue, activeIdx, activeIdx);
      setQueue(removed.nextQueue); setActiveIdx(removed.nextActiveIdx);
      await fetchDocuments(); await fetchMasterData();
    } catch (err: unknown) {
      setBanner({ type: "err", text: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" });
    } finally { setIsSaving(false); }
  };

  const handleBatchSaveValid = async () => {
    const { saveable, remaining } = partitionBatchSaveQueue(queue, existingBillingNos);
    if (saveable.length === 0) return;
    setIsSaving(true); setBanner(null);
    try {
      for (const doc of saveable) {
        const res = await fetch("/api/documents", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...doc, overwriteExisting: false }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error || `บันทึก Billing #${doc.billingNo} ไม่สำเร็จ`);
        }
      }
      setQueue(remaining); setActiveIdx(0);
      setBanner({ type: "ok", text: `บันทึกใบส่งของที่ผ่านเกณฑ์สำเร็จรวดเดียว ${saveable.length} ใบ!` });
      await fetchDocuments(); await fetchMasterData();
    } catch (err: unknown) {
      setBanner({ type: "err", text: err instanceof Error ? err.message : "เกิดข้อผิดพลาดระหว่างบันทึกแบบกลุ่ม" });
    } finally { setIsSaving(false); }
  };

  return {
    activeTab, setActiveTab, isAuthChecking, isAuthenticated, user,
    apiKey, setApiKey, queue, setQueue, activeIdx, setActiveIdx, existingBillingNos,
    isExtracting, isSaving, duplicateBillingNo, banner,
    savedDocs, masterData, fetchDocuments,
    handleLogin, handleLogout, handleLoadSamples, handleUploadFiles, handleSaveDocument, handleBatchSaveValid,
  };
}
