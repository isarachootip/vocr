import { z } from "zod";

export const LineChatStatusSchema = z.enum(["OPEN", "PENDING", "RESOLVED"]);
export type LineChatStatus = z.infer<typeof LineChatStatusSchema>;

export const LineChatDirectionSchema = z.enum(["INBOUND", "OUTBOUND", "PRIVATE_NOTE"]);
export type LineChatDirection = z.infer<typeof LineChatDirectionSchema>;

export const LineChatSenderRoleSchema = z.enum(["CUSTOMER", "ADMIN", "BOT"]);
export type LineChatSenderRole = z.infer<typeof LineChatSenderRoleSchema>;

export interface LineChatMessageRecord {
  id: string;
  conversationId: string;
  direction: LineChatDirection;
  senderRole: LineChatSenderRole;
  senderName: string;
  messageType: "text" | "image" | "file" | "note";
  content: string;
  billingNo: string | null;
  fileUrl: string | null;
  createdAt: string;
}

export interface LineChatConversationRecord {
  id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl: string | null;
  status: LineChatStatus;
  botPaused: boolean;
  unreadCount: number;
  assignedToName: string | null;
  customerCode: string | null;
  customerTag: string | null;
  lastMessageAt: string;
  messages: LineChatMessageRecord[];
}

export const SendLineChatInputSchema = z.object({
  conversationId: z.string().trim().min(1, "กรุณาระบุห้องสนทนา"),
  mode: z.enum(["REPLY", "PRIVATE_NOTE"]).default("REPLY"),
  content: z.string().trim().min(1, "กรุณาพิมพ์ข้อความ"),
  senderName: z.string().trim().default("แอดมินดูแลระบบ"),
  billingNo: z.string().trim().nullable().optional(),
});

export type SendLineChatInput = z.infer<typeof SendLineChatInputSchema>;

export const UpdateConversationStateSchema = z.object({
  conversationId: z.string().trim().min(1, "กรุณาระบุห้องสนทนา"),
  status: LineChatStatusSchema.optional(),
  botPaused: z.boolean().optional(),
  markRead: z.boolean().optional(),
  assignedToName: z.string().trim().nullable().optional(),
});

export type UpdateConversationStateInput = z.infer<typeof UpdateConversationStateSchema>;

export interface QuickReplyTemplate {
  id: string;
  category: "GREETING" | "QUESTION" | "ANSWER";
  slashCommand: string;
  label: string;
  content: string;
}

export const QUICK_REPLY_TEMPLATES: QuickReplyTemplate[] = [
  {
    id: "tpl-greeting",
    category: "GREETING",
    slashCommand: "/ทักทายทั่วไป",
    label: "/ทักทายทั่วไป",
    content:
      "สวัสดีค่ะ ยินดีต้อนรับสู่บริการ ITE-SERVICE (ระบบรับใบส่งขององค์การเภสัชกรรม GPO OCR) มีเรื่องใดให้เจ้าหน้าที่ช่วยดูแลหรือส่งรูปใบส่งของเข้ามาได้เลยนะคะ 😊",
  },
  {
    id: "tpl-received-ocr",
    category: "ANSWER",
    slashCommand: "/แจ้งรับใบส่งของ",
    label: "/แจ้งรับใบส่งของ",
    content:
      "ได้รับไฟล์รูปภาพ/PDF ใบส่งของเรียบร้อยแล้วค่ะ ระบบ AI OCR กำลังสกัดข้อมูล 3 ระดับ (Header • Items • Lots) และเจ้าหน้าที่จะตรวจสอบความถูกต้องให้ทันทีค่ะ 📄✅",
  },
  {
    id: "tpl-request-clear-photo",
    category: "QUESTION",
    slashCommand: "/ขอรูปใบส่งของชัดๆ",
    label: "/ขอรูปใบส่งของชัดๆ",
    content:
      "รบกวนส่งภาพถ่ายใบส่งของเพิ่มเติมโดยให้เห็นเลขที่ใบส่งของ (Billing No.), ตารางรายการยา/Lot และลายเซ็นผู้รับของชัดเจน เพื่อความแม่นยำในการตรวจสอบค่ะ 🙏",
  },
  {
    id: "tpl-verified-ok",
    category: "ANSWER",
    slashCommand: "/ยืนยันผลตรวจสอบ",
    label: "/ยืนยันผลตรวจสอบ",
    content:
      "เจ้าหน้าที่ตรวจสอบข้อมูลใบส่งของและยอดรวมสุทธิ (รวม VAT 7%) ครบถ้วนถูกต้องแล้ว บันทึกเข้าคลังเอกสารเรียบร้อยค่ะ ขอบพระคุณค่ะ ✨",
  },
  {
    id: "tpl-check-lot",
    category: "QUESTION",
    slashCommand: "/สอบถามเลขLot",
    label: "/สอบถามเลขLot",
    content:
      "ขออนุญาตสอบถามข้อมูลเพิ่มเติมเกี่ยวกับเลขที่ผลิต (Lot No.) และวันหมดอายุของรายการยาในใบส่งของใบนี้ เพื่อยืนยันกับฐานข้อมูลคลังยาค่ะ",
  },
  {
    id: "tpl-apologize-delay",
    category: "GREETING",
    slashCommand: "/ขออภัยล่าช้า",
    label: "/ขออภัยล่าช้า",
    content:
      "ขออภัยในความล่าช้าค่ะคุณลูกค้า 🙏 เจ้าหน้าที่ฝ่ายตรวจสอบเอกสารกำลังเร่งดำเนินการตรวจสอบใบส่งของให้ค่ะ",
  },
];
