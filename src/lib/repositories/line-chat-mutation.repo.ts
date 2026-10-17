import { prisma } from "../db/prisma";
import type {
  LineChatConversationRecord,
  LineChatDirection,
  LineChatSenderRole,
  UpdateConversationStateInput,
} from "../schemas/line-chat.schema";
import { ensureLineDatabaseSchema } from "./line-config.repo";
import { mapConversation } from "./line-chat.repo";

export async function findOrCreateLineConversation(input: {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string | null;
  customerCode?: string | null;
  customerTag?: string | null;
}): Promise<LineChatConversationRecord> {
  await ensureLineDatabaseSchema();

  const upserted = await prisma.lineChatConversation.upsert({
    where: { lineUserId: input.lineUserId },
    create: {
      lineUserId: input.lineUserId,
      displayName: input.displayName,
      pictureUrl: input.pictureUrl ?? null,
      status: "OPEN",
      botPaused: false,
      unreadCount: 0,
      assignedToName: "รอรับเรื่อง (Unassigned)",
      customerCode: input.customerCode ?? null,
      customerTag: input.customerTag ?? "MEMBER • LINE Live",
    },
    update: {
      displayName: input.displayName,
      pictureUrl: input.pictureUrl ?? undefined,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return mapConversation(upserted);
}

export async function appendLineChatMessage(input: {
  conversationId?: string;
  lineUserId?: string;
  displayName?: string;
  direction: LineChatDirection;
  senderRole: LineChatSenderRole;
  senderName: string;
  messageType?: "text" | "image" | "file" | "note";
  content: string;
  billingNo?: string | null;
  fileUrl?: string | null;
}): Promise<LineChatConversationRecord> {
  await ensureLineDatabaseSchema();

  let targetConvId = input.conversationId;
  if (!targetConvId) {
    const conv = await findOrCreateLineConversation({
      lineUserId: input.lineUserId || `U_LINE_${Date.now()}`,
      displayName: input.displayName || input.senderName,
    });
    targetConvId = conv.id;
  }

  const isInbound = input.direction === "INBOUND";
  const isAdminReply =
    input.direction === "OUTBOUND" && input.senderRole === "ADMIN";

  await prisma.lineChatMessage.create({
    data: {
      conversationId: targetConvId,
      direction: input.direction,
      senderRole: input.senderRole,
      senderName: input.senderName,
      messageType: input.messageType ?? "text",
      content: input.content,
      billingNo: input.billingNo ?? null,
      fileUrl: input.fileUrl ?? null,
    },
  });

  const updated = await prisma.lineChatConversation.update({
    where: { id: targetConvId },
    data: {
      lastMessageAt: new Date(),
      ...(isInbound
        ? {
            unreadCount: { increment: 1 },
            status: "OPEN",
          }
        : {}),
      ...(isAdminReply
        ? {
            botPaused: true,
            unreadCount: 0,
            assignedToName: input.senderName,
          }
        : {}),
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return mapConversation(updated);
}

export async function updateLineConversationState(
  input: UpdateConversationStateInput
): Promise<LineChatConversationRecord> {
  await ensureLineDatabaseSchema();

  const updated = await prisma.lineChatConversation.update({
    where: { id: input.conversationId },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.botPaused !== undefined ? { botPaused: input.botPaused } : {}),
      ...(input.markRead ? { unreadCount: 0 } : {}),
      ...(input.assignedToName !== undefined
        ? { assignedToName: input.assignedToName }
        : {}),
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return mapConversation(updated);
}
