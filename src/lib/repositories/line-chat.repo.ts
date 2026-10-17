import { prisma } from "../db/prisma";
import type {
  LineChatConversationRecord,
  LineChatDirection,
  LineChatMessageRecord,
  LineChatSenderRole,
  LineChatStatus,
} from "../schemas/line-chat.schema";
import { ensureLineDatabaseSchema } from "./line-config.repo";

export function mapMessage(row: {
  id: string;
  conversationId: string;
  direction: string;
  senderRole: string;
  senderName: string;
  messageType: string;
  content: string;
  billingNo: string | null;
  fileUrl: string | null;
  createdAt: Date;
}): LineChatMessageRecord {
  return {
    id: row.id,
    conversationId: row.conversationId,
    direction: (row.direction as LineChatDirection) || "INBOUND",
    senderRole: (row.senderRole as LineChatSenderRole) || "CUSTOMER",
    senderName: row.senderName,
    messageType: (row.messageType as LineChatMessageRecord["messageType"]) || "text",
    content: row.content,
    billingNo: row.billingNo,
    fileUrl: row.fileUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapConversation(row: {
  id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl: string | null;
  status: string;
  botPaused: boolean;
  unreadCount: number;
  assignedToName: string | null;
  customerCode: string | null;
  customerTag: string | null;
  lastMessageAt: Date;
  messages: Array<{
    id: string;
    conversationId: string;
    direction: string;
    senderRole: string;
    senderName: string;
    messageType: string;
    content: string;
    billingNo: string | null;
    fileUrl: string | null;
    createdAt: Date;
  }>;
}): LineChatConversationRecord {
  return {
    id: row.id,
    lineUserId: row.lineUserId,
    displayName: row.displayName,
    pictureUrl: row.pictureUrl,
    status: (row.status as LineChatStatus) || "OPEN",
    botPaused: row.botPaused,
    unreadCount: row.unreadCount,
    assignedToName: row.assignedToName,
    customerCode: row.customerCode,
    customerTag: row.customerTag,
    lastMessageAt: row.lastMessageAt.toISOString(),
    messages: row.messages.map(mapMessage),
  };
}

export async function seedDefaultLineConversationsIfNeeded(): Promise<void> {
  await ensureLineDatabaseSchema();

  const existingSomchai = await prisma.lineChatConversation.findUnique({
    where: { lineUserId: "U_SOMCHAI_POLICE_HOSP" },
  });
  if (!existingSomchai) {
    await prisma.lineChatConversation.create({
      data: {
        lineUserId: "U_SOMCHAI_POLICE_HOSP",
        displayName: "ภก. สมชาย ใจดี (รพ.ตำรวจ)",
        status: "OPEN",
        botPaused: true,
        unreadCount: 1,
        assignedToName: "วิภา ส. • ทีมตรวจสอบใบส่งของ",
        customerCode: "10085290",
        customerTag: "PLATINUM • รพ.รัฐ",
        lastMessageAt: new Date(Date.now() - 5 * 60 * 1000),
        messages: {
          create: [
            {
              direction: "INBOUND",
              senderRole: "CUSTOMER",
              senderName: "ภก. สมชาย ใจดี (รพ.ตำรวจ)",
              messageType: "file",
              content: "สวัสดีครับ ส่งไฟล์ใบส่งของ GPO เลขที่ Billing #3001275083 (Oseltamivir 2 Lots) เข้ามาให้ตรวจสอบครับ",
              billingNo: "3001275083",
              fileUrl: "/samples/gpo-sample-4.jpg",
              createdAt: new Date(Date.now() - 25 * 60 * 1000),
            },
            {
              direction: "PRIVATE_NOTE",
              senderRole: "ADMIN",
              senderName: "วิภา ส.",
              messageType: "note",
              content: "@ทีมคลังยา ลูกค้าระดับโรงพยาบาลตำรวจ ส่งใบส่งของยาต้านไวรัส 2 Lot (K685238, K685239) ยอด 187,500 บาท ช่วยตรวจลายเซ็นผู้รับของให้ด้วยค่ะ",
              billingNo: "3001275083",
              createdAt: new Date(Date.now() - 18 * 60 * 1000),
            },
            {
              direction: "OUTBOUND",
              senderRole: "BOT",
              senderName: "ITE-SERVICE AI Bot",
              messageType: "text",
              content: "ได้รับไฟล์ใบส่งของ Billing #3001275083 (โรงพยาบาลตำรวจ) ยอดสุทธิ 187,500.00 บาท เรียบร้อยแล้วค่ะ ระบบสกัด OCR ครบ 2 Lots กำลังรอเจ้าหน้าที่ยืนยันขั้นสุดท้ายค่ะ",
              billingNo: "3001275083",
              createdAt: new Date(Date.now() - 15 * 60 * 1000),
            },
            {
              direction: "INBOUND",
              senderRole: "CUSTOMER",
              senderName: "ภก. สมชาย ใจดี (รพ.ตำรวจ)",
              messageType: "text",
              content: "ตรวจสอบยอดสุทธิและ Lot ยาเรียบร้อยไหมครับ ต้องใช้อ้างอิงรับยาเข้าคลังวันนี้ครับ",
              billingNo: "3001275083",
              createdAt: new Date(Date.now() - 5 * 60 * 1000),
            },
          ],
        },
      },
    });
  }

  const existingSamran = await prisma.lineChatConversation.findUnique({
    where: { lineUserId: "U_SAMRAN_LINE_LIVE" },
  });
  if (!existingSamran) {
    await prisma.lineChatConversation.create({
      data: {
        lineUserId: "U_SAMRAN_LINE_LIVE",
        displayName: "samran",
        status: "OPEN",
        botPaused: false,
        unreadCount: 3,
        assignedToName: "รอรับเรื่อง (Unassigned)",
        customerCode: "1150000",
        customerTag: "MEMBER • LINE Live",
        lastMessageAt: new Date(),
        messages: {
          create: [
            {
              direction: "OUTBOUND",
              senderRole: "BOT",
              senderName: "ITE-SERVICE Official",
              messageType: "text",
              content: "สวัสดี คุณ samran นี่คือบัญชีทางการของ ITE-SERVICE ขอบคุณที่เป็นเพื่อนกับเรา ระบบพร้อมรับรูปใบส่งขององค์การเภสัชกรรมและตอบคำถามอัตโนมัติค่ะ",
              createdAt: new Date(Date.now() - 60 * 60 * 1000),
            },
            {
              direction: "INBOUND",
              senderRole: "CUSTOMER",
              senderName: "samran",
              messageType: "text",
              content: "สวัสดี",
              createdAt: new Date(Date.now() - 59 * 60 * 1000),
            },
            {
              direction: "INBOUND",
              senderRole: "CUSTOMER",
              senderName: "samran",
              messageType: "text",
              content: "ต้องการทักทาย",
              createdAt: new Date(Date.now() - 58 * 60 * 1000),
            },
            {
              direction: "INBOUND",
              senderRole: "CUSTOMER",
              senderName: "samran",
              messageType: "text",
              content: "สวัสดี",
              createdAt: new Date(Date.now() - 2 * 60 * 1000),
            },
          ],
        },
      },
    });
  }
}

export async function listLineConversations(): Promise<LineChatConversationRecord[]> {
  await seedDefaultLineConversationsIfNeeded();
  const rows = await prisma.lineChatConversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  return rows.map(mapConversation);
}
