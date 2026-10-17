"use client";

import React from "react";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { LoginGate } from "@/components/auth/LoginGate";
import { BatchDropzone } from "@/components/upload/BatchDropzone";
import { ReviewWorkspace } from "@/components/review/ReviewWorkspace";
import { DocumentExplorerView } from "@/components/explorer/DocumentExplorerView";
import { MasterDataPanel } from "@/components/explorer/MasterDataPanel";
import { UserManagementPanel } from "@/components/users/UserManagementPanel";
import { LineConfigPanel } from "@/components/line/LineConfigPanel";
import { ContactUsPanel } from "@/components/contact/ContactUsPanel";
import { useOcrDashboard } from "@/hooks/useOcrDashboard";
import { removeQueueItemAtIndex } from "@/lib/domain/queue-manager";
import {
  canAccessTab,
  canDeleteDocuments,
  canEditContactProfile,
} from "@/lib/auth/permissions";

export default function HomePage() {
  const {
    activeTab, setActiveTab, isAuthChecking, isAuthenticated, user,
    apiKey, setApiKey, queue, setQueue, activeIdx, setActiveIdx, existingBillingNos,
    isExtracting, isSaving, duplicateBillingNo, banner,
    savedDocs, masterData, fetchDocuments,
    handleLogin, handleLogout, handleLoadSamples, handleUploadFiles, handleSaveDocument, handleBatchSaveValid,
  } = useOcrDashboard();

  if (isAuthChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500">
        กำลังตรวจสอบสถานะผู้ใช้งาน...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginGate onLogin={handleLogin} />;
  }

  const effectiveTab = canAccessTab(user.role, activeTab) ? activeTab : "WORKSPACE";

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <TopNavBar
        activeTab={effectiveTab}
        onSelectTab={(tab) => {
          if (canAccessTab(user.role, tab)) setActiveTab(tab);
        }}
        user={user}
        onLogout={handleLogout}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        queueCount={queue.length}
        savedCount={savedDocs.length}
      />

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 pt-4">
        {banner && (
          <div
            className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${
              banner.type === "ok"
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-rose-300 bg-rose-50 text-rose-900"
            }`}
          >
            {banner.text}
          </div>
        )}

        {effectiveTab === "WORKSPACE" && (
          <>
            <BatchDropzone
              isExtracting={isExtracting}
              onUploadFiles={handleUploadFiles}
              onLoadSamples={handleLoadSamples}
            />
            {queue.length > 0 ? (
              <ReviewWorkspace
                queue={queue}
                activeIdx={activeIdx}
                existingBillingNos={existingBillingNos}
                onSelectIdx={setActiveIdx}
                onUpdateActive={(updated) =>
                  setQueue((prev) => prev.map((item, i) => (i === activeIdx ? updated : item)))
                }
                onRemoveFromQueue={(idx) => {
                  const removed = removeQueueItemAtIndex(queue, idx, activeIdx);
                  setQueue(removed.nextQueue);
                  setActiveIdx(removed.nextActiveIdx);
                }}
                onClearQueue={() => {
                  setQueue([]);
                  setActiveIdx(0);
                }}
                onSaveDocument={handleSaveDocument}
                onBatchSaveValid={handleBatchSaveValid}
                isSaving={isSaving}
                duplicateBillingNo={duplicateBillingNo}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  ยังไม่มีเอกสารในคิวตรวจสอบ
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  กดปุ่ม &ldquo;อัปโหลดรูปใบส่งของ (1 หรือหลายใบพร้อมกัน)&rdquo; หรือเปิดเมนู &ldquo;ข้อมูลตัวอย่างสำหรับทดสอบ&rdquo; ด้านบนเพื่อเริ่มสกัดข้อมูล
                </p>
              </div>
            )}
          </>
        )}

        {effectiveTab === "EXPLORER" && (
          <DocumentExplorerView
            documents={savedDocs}
            onRefresh={fetchDocuments}
            onInspectDocument={(doc) => {
              setQueue([doc]);
              setActiveIdx(0);
              setActiveTab("WORKSPACE");
            }}
            onDeleteDocument={async (id) => {
              await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
              await fetchDocuments();
            }}
            canDelete={canDeleteDocuments(user.role)}
          />
        )}

        {effectiveTab === "MASTER_DATA" && (
          <MasterDataPanel customers={masterData.customers} products={masterData.products} />
        )}

        {effectiveTab === "USERS" && <UserManagementPanel currentUserRole={user.role} />}

        {effectiveTab === "LINE_OA" && (
          <LineConfigPanel
            onDocumentReceived={async () => { await fetchDocuments(); }}
            onOpenInWorkspace={(doc) => {
              setQueue([doc]);
              setActiveIdx(0);
              setActiveTab("WORKSPACE");
            }}
            onOpenBillingInWorkspace={(billingNo) => {
              const matched = savedDocs.find((d) => d.billingNo === billingNo);
              if (matched) {
                setQueue([matched]);
                setActiveIdx(0);
                setActiveTab("WORKSPACE");
              }
            }}
          />
        )}

        {effectiveTab === "CONTACT" && (
          <ContactUsPanel canEdit={canEditContactProfile(user.role)} />
        )}
      </main>
    </div>
  );
}
