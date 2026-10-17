"use client";

import React, { useState } from "react";
import {
  Globe,
  MessageCircle,
  Share2,
  Camera,
  Music2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import type { ContactProfileInput } from "@/lib/schemas/contact.schema";

interface SocialChannelCardsProps {
  profile: ContactProfileInput;
}

interface ChannelItem {
  key: string;
  platform: string;
  subtitle: string;
  label: string;
  url: string;
  badgeClass: string;
  buttonClass: string;
  borderClass: string;
  icon: React.ReactNode;
}

export function SocialChannelCards({ profile }: SocialChannelCardsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (key: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const channels: ChannelItem[] = [
    {
      key: "website",
      platform: "Website",
      subtitle: "เว็บไซต์อย่างเป็นทางการ",
      label: profile.websiteLabel,
      url: profile.websiteUrl,
      badgeClass: "bg-teal-600 text-white",
      buttonClass: "bg-teal-700 hover:bg-teal-800 text-white",
      borderClass: "hover:border-teal-400",
      icon: <Globe className="h-5 w-5" />,
    },
    {
      key: "line",
      platform: "LINE Official",
      subtitle: "แชทสอบถาม & ส่งเอกสารอัตโนมัติ",
      label: profile.lineLabel,
      url: profile.lineUrl,
      badgeClass: "bg-emerald-500 text-white",
      buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
      borderClass: "hover:border-emerald-400",
      icon: <MessageCircle className="h-5 w-5" />,
    },
    {
      key: "facebook",
      platform: "Facebook",
      subtitle: "ข่าวสารและอัปเดตบริการ",
      label: profile.facebookLabel,
      url: profile.facebookUrl,
      badgeClass: "bg-blue-600 text-white",
      buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
      borderClass: "hover:border-blue-400",
      icon: <Share2 className="h-5 w-5" />,
    },
    {
      key: "instagram",
      platform: "Instagram",
      subtitle: "ภาพกิจกรรมและผลงาน",
      label: profile.instagramLabel,
      url: profile.instagramUrl,
      badgeClass: "bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white",
      buttonClass: "bg-pink-600 hover:bg-pink-700 text-white",
      borderClass: "hover:border-pink-400",
      icon: <Camera className="h-5 w-5" />,
    },
    {
      key: "tiktok",
      platform: "TikTok",
      subtitle: "คลิปแนะนำฟีเจอร์และวิธีใช้งาน",
      label: profile.tiktokLabel,
      url: profile.tiktokUrl,
      badgeClass: "bg-slate-900 text-white",
      buttonClass: "bg-slate-900 hover:bg-slate-800 text-white",
      borderClass: "hover:border-slate-500",
      icon: <Music2 className="h-5 w-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {channels.map((ch) => {
        const isCopied = copiedKey === ch.key;
        return (
          <div
            key={ch.key}
            className={`flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition ${ch.borderClass}`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${ch.badgeClass}`}
                >
                  {ch.icon}
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                  {ch.platform}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-[11px] font-medium text-slate-500">
                  {ch.subtitle}
                </p>
                <h3 className="mt-0.5 truncate text-sm font-bold text-slate-900">
                  {ch.label}
                </h3>
                <p
                  className="mt-1 truncate font-mono text-[11px] text-slate-500"
                  title={ch.url}
                >
                  {ch.url}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
              <a
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition ${ch.buttonClass}`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>เปิดลิงก์</span>
              </a>
              <button
                type="button"
                onClick={() => void handleCopy(ch.key, ch.url)}
                title="คัดลอกลิงก์"
                className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[11px] text-emerald-700">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <Copy className="h-3.5 w-3.5 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
