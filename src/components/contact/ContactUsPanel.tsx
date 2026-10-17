"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Edit3,
  Loader2,
} from "lucide-react";
import {
  DEFAULT_CONTACT_PROFILE,
  type ContactProfileInput,
} from "@/lib/schemas/contact.schema";
import { SocialChannelCards } from "./SocialChannelCards";
import { ContactEditForm } from "./ContactEditForm";

interface ContactUsPanelProps {
  canEdit?: boolean;
}

export function ContactUsPanel({ canEdit = false }: ContactUsPanelProps) {
  const [profile, setProfile] = useState<ContactProfileInput>(DEFAULT_CONTACT_PROFILE);
  const [draft, setDraft] = useState<ContactProfileInput>(DEFAULT_CONTACT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    void fetch("/api/contact")
      .then((r) => r.json())
      .then((data: { profile?: ContactProfileInput }) => {
        if (data.profile) {
          setProfile(data.profile);
          setDraft(data.profile);
        }
      })
      .catch(() => {
        // Fallback to default
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as { profile?: ContactProfileInput; error?: string };
      if (!res.ok || !data.profile) {
        throw new Error(data.error || "บันทึกข้อมูลติดต่อไม่สำเร็จ");
      }
      setProfile(data.profile);
      setDraft(data.profile);
      setIsEditing(false);
      setFeedback({ type: "ok", text: "บันทึกข้อมูลติดต่อ ITE Computer เรียบร้อยแล้ว" });
    } catch (err: unknown) {
      setFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Building2 className="h-7 w-7 text-teal-200" />
            </div>
            <div>
              <span className="inline-block rounded-full bg-teal-500/20 px-3 py-0.5 text-[11px] font-semibold text-teal-200">
                ติดต่อเรา • Official Channels
              </span>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                {profile.companyName}
              </h2>
              <p className="mt-1 max-w-3xl text-xs text-teal-100/90">
                {profile.tagline}
              </p>
            </div>
          </div>

          {canEdit && !isEditing && (
            <button
              type="button"
              onClick={() => {
                setDraft(profile);
                setFeedback(null);
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/25"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>แก้ไขข้อมูลติดต่อ & ลิงก์</span>
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-white/15 pt-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2.5">
            <Phone className="h-4 w-4 shrink-0 text-teal-300" />
            <div>
              <div className="text-[10px] text-teal-200">เบอร์โทรศัพท์</div>
              <div className="font-semibold">{profile.phone}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2.5">
            <Mail className="h-4 w-4 shrink-0 text-teal-300" />
            <div>
              <div className="text-[10px] text-teal-200">อีเมลติดต่อ</div>
              <div className="font-semibold">{profile.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2.5">
            <Clock className="h-4 w-4 shrink-0 text-teal-300" />
            <div>
              <div className="text-[10px] text-teal-200">เวลาทำการ</div>
              <div className="font-semibold">{profile.businessHours}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-teal-300" />
            <div>
              <div className="text-[10px] text-teal-200">ที่อยู่ / สำนักงาน</div>
              <div className="font-semibold">{profile.address}</div>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${
            feedback.type === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-rose-300 bg-rose-50 text-rose-900"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-xs text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-teal-600" />
          กำลังโหลดช่องทางติดต่อ...
        </div>
      ) : (
        <SocialChannelCards profile={profile} />
      )}

      {isEditing && (
        <ContactEditForm
          draft={draft}
          isSaving={isSaving}
          onUpdateField={(key, value) =>
            setDraft((prev) => ({ ...prev, [key]: value }))
          }
          onCancel={() => setIsEditing(false)}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}
