import { NextResponse } from "next/server";
import { listLineConversations } from "@/lib/repositories/line-chat.repo";
import {
  appendLineChatMessage,
  updateLineConversationState,
} from "@/lib/repositories/line-chat-mutation.repo";
import { getLineOaConfig } from "@/lib/repositories/line-config.repo";
import {
  QUICK_REPLY_TEMPLATES,
  SendLineChatInputSchema,
  UpdateConversationStateSchema,
} from "@/lib/schemas/line-chat.schema";
import { pushLineMessages } from "@/lib/services/line-messaging.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const conversations = await listLineConversations();
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
    return NextResponse.json({
      ok: true,
      conversations,
      totalUnread,
      quickTemplates: QUICK_REPLY_TEMPLATES,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "ไม่สามารถดึงรายการแชท LINE Inbox ได้";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = SendLineChatInputSchema.parse(body);

    if (parsed.mode === "PRIVATE_NOTE") {
      const conversation = await appendLineChatMessage({
        conversationId: parsed.conversationId,
        direction: "PRIVATE_NOTE",
        senderRole: "ADMIN",
        senderName: parsed.senderName,
        messageType: "note",
        content: parsed.content,
        billingNo: parsed.billingNo ?? null,
      });

      return NextResponse.json({
        ok: true,
        mode: "PRIVATE_NOTE",
        conversation,
      });
    }

    const allConvs = await listLineConversations();
    const targetConv = allConvs.find((c) => c.id === parsed.conversationId);
    if (!targetConv) {
      return NextResponse.json({ error: "ไม่พบห้องสนทนาที่ระบุ" }, { status: 404 });
    }

    const config = await getLineOaConfig();
    const pushResult = await pushLineMessages(
      targetConv.lineUserId,
      [{ type: "text", text: parsed.content }],
      config.channelAccessToken
    );

    const conversation = await appendLineChatMessage({
      conversationId: parsed.conversationId,
      direction: "OUTBOUND",
      senderRole: "ADMIN",
      senderName: parsed.senderName,
      messageType: "text",
      content: parsed.content,
      billingNo: parsed.billingNo ?? null,
    });

    return NextResponse.json({
      ok: true,
      mode: "REPLY",
      linePush: pushResult,
      conversation,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "ไม่สามารถส่งข้อความแชท LINE ได้";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = UpdateConversationStateSchema.parse(body);
    const conversation = await updateLineConversationState(parsed);

    return NextResponse.json({
      ok: true,
      conversation,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "ไม่สามารถอัปเดตสถานะห้องแชทได้";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
