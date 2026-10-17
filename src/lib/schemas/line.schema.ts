import { z } from "zod";

export const DEFAULT_LINE_CONFIG = {
  channelId: "2012056909",
  channelSecret: "95207e2dcc9d8f795f09d9db03440247",
  channelAccessToken:
    "HvNIl/LN67E/48C1QuEQzOwSLRZQXqe5ToRvhZEnzzTFttI72hveoOieMtdyi+UaXiw3hy48ywe4gd5vOq1NXksrsoviFyXyR4qi2zSiIGZWhT50H/6C5KuHodDEKoR7nR1d/OxiXWFt0kccJ23zsQdB04t89/1O/w1cDnyilFU=",
  oaUrl: "https://lin.ee/zW8Iu4s",
  isActive: true,
  autoReplyFlex: true,
} as const;

export const LineOaConfigInputSchema = z.object({
  channelId: z.string().trim().min(1, "กรุณาระบุ Channel ID"),
  channelSecret: z.string().trim().min(8, "กรุณาระบุ Channel Secret"),
  channelAccessToken: z.string().trim().min(10, "กรุณาระบุ Channel Access Token"),
  oaUrl: z.string().trim().url("กรุณาระบุลิงก์ LINE OA ที่ถูกต้อง").default("https://lin.ee/zW8Iu4s"),
  isActive: z.boolean().default(true),
  autoReplyFlex: z.boolean().default(true),
});

export type LineOaConfigInput = z.infer<typeof LineOaConfigInputSchema>;

export interface LineOaConfigRecord extends LineOaConfigInput {
  id: string;
  updatedAt: string;
}

export interface LineBotProfileInfo {
  userId: string;
  basicId?: string;
  displayName: string;
  pictureUrl?: string;
}

export interface LineInboxMessageRecord {
  id: string;
  lineMessageId: string;
  messageType: string;
  fileName: string | null;
  mimeType: string | null;
  fileDataUrl: string | null;
  lineUserId: string | null;
  lineDisplayName: string;
  ocrStatus: "PROCESSING" | "COMPLETED" | "FAILED";
  ocrError: string | null;
  billingNo: string | null;
  customerName: string | null;
  netAmount: number | null;
  createdAt: string;
}

export const LineWebhookEventSourceSchema = z.object({
  type: z.enum(["user", "group", "room"]),
  userId: z.string().optional(),
  groupId: z.string().optional(),
  roomId: z.string().optional(),
});

export const LineWebhookMessageSchema = z.object({
  id: z.string(),
  type: z.string(),
  text: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  contentProvider: z
    .object({
      type: z.enum(["line", "external"]),
      originalContentUrl: z.string().optional(),
      previewImageUrl: z.string().optional(),
    })
    .optional(),
});

export const LineWebhookEventSchema = z.object({
  type: z.string(),
  replyToken: z.string().optional(),
  timestamp: z.number().optional(),
  source: LineWebhookEventSourceSchema.optional(),
  message: LineWebhookMessageSchema.optional(),
});

export const LineWebhookBodySchema = z.object({
  destination: z.string().optional(),
  events: z.array(LineWebhookEventSchema).default([]),
});

export type LineWebhookEvent = z.infer<typeof LineWebhookEventSchema>;
export type LineWebhookBody = z.infer<typeof LineWebhookBodySchema>;
