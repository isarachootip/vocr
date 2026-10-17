import assert from "node:assert/strict";
import {
  GET as getLineChatRoute,
  POST as postLineChatRoute,
  PATCH as patchLineChatRoute,
} from "../../src/app/api/line/chat/route";
import { POST as postWebhookRoute } from "../../src/app/api/line/webhook/route";
import type {
  LineChatConversationRecord,
  QuickReplyTemplate,
} from "../../src/lib/schemas/line-chat.schema";

export async function runLineChatInboxTests(): Promise<void> {
  // 1. Verify GET /api/line/chat seeds and returns conversations (samran & ภก. สมชาย ใจดี)
  const initialRes = await getLineChatRoute();
  assert.equal(initialRes.status, 200);
  const initialData = (await initialRes.json()) as {
    ok: boolean;
    conversations: LineChatConversationRecord[];
    totalUnread: number;
    quickTemplates: QuickReplyTemplate[];
  };

  assert.equal(initialData.ok, true);
  assert.equal(initialData.conversations.length >= 2, true);
  assert.equal(initialData.quickTemplates.length >= 5, true);

  const samranConv = initialData.conversations.find(
    (c) => c.lineUserId === "U_SAMRAN_LINE_LIVE"
  );
  const somchaiConv = initialData.conversations.find(
    (c) => c.lineUserId === "U_SOMCHAI_POLICE_HOSP"
  );
  assert.ok(samranConv, "samran conversation must exist");
  assert.ok(somchaiConv, "somchai conversation must exist");

  // 2. Test Admin 2-Way Reply (POST /api/line/chat mode=REPLY) -> Auto-pauses Bot & clears unread
  const replyRes = await postLineChatRoute(
    new Request("http://localhost:3000/api/line/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: samranConv.id,
        mode: "REPLY",
        content: "สวัสดีค่ะคุณ samran ยินดีให้บริการค่ะ สามารถส่งรูปใบส่งของเข้ามาได้เลยนะคะ",
        senderName: "สมศักดิ์ บริหารระบบ",
      }),
    })
  );
  assert.equal(replyRes.status, 200);
  const replyData = (await replyRes.json()) as {
    ok: boolean;
    mode: string;
    conversation: LineChatConversationRecord;
  };
  assert.equal(replyData.ok, true);
  assert.equal(replyData.conversation.botPaused, true);
  assert.equal(replyData.conversation.unreadCount, 0);
  assert.equal(replyData.conversation.assignedToName, "สมศักดิ์ บริหารระบบ");

  // 3. Test Private Note (POST /api/line/chat mode=PRIVATE_NOTE)
  const noteRes = await postLineChatRoute(
    new Request("http://localhost:3000/api/line/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: samranConv.id,
        mode: "PRIVATE_NOTE",
        content: "@ทีมตรวจสอบ ลูกค้าคุณ samran เพิ่งแอด LINE OA เข้ามาใหม่ รอรับไฟล์ใบส่งของล็อตแรก",
        senderName: "สมศักดิ์ บริหารระบบ",
      }),
    })
  );
  assert.equal(noteRes.status, 200);
  const noteData = (await noteRes.json()) as {
    conversation: LineChatConversationRecord;
  };
  const lastNote =
    noteData.conversation.messages[noteData.conversation.messages.length - 1];
  assert.equal(lastNote.direction, "PRIVATE_NOTE");
  assert.equal(lastNote.content.includes("คุณ samran"), true);

  // 4. Test Bot Handover: When botPaused=true, incoming text does NOT trigger AI auto-reply
  const msgCountBefore = noteData.conversation.messages.length;
  const simTextRes = await postWebhookRoute(
    new Request("http://localhost:3000/api/line/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-line-simulator": "1" },
      body: JSON.stringify({
        senderName: "samran",
        lineUserId: "U_SAMRAN_LINE_LIVE",
        messageType: "text",
        chatText: "กำลังถ่ายรูปใบส่งของส่งให้ครับ",
      }),
    })
  );
  assert.equal(simTextRes.status, 200);
  const simTextData = (await simTextRes.json()) as { botPaused: boolean };
  assert.equal(simTextData.botPaused, true);

  // Only 1 message (the customer's inbound message) should be added because Bot is Paused
  const afterSimRes = await getLineChatRoute();
  const afterSimData = (await afterSimRes.json()) as {
    conversations: LineChatConversationRecord[];
  };
  const updatedSamran = afterSimData.conversations.find(
    (c) => c.id === samranConv.id
  )!;
  assert.equal(updatedSamran.messages.length, msgCountBefore + 1);
  assert.equal(updatedSamran.unreadCount, 1);

  // 5. Test PATCH /api/line/chat (Status transition & re-enabling AI Bot)
  const patchRes = await patchLineChatRoute(
    new Request("http://localhost:3000/api/line/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: samranConv.id,
        status: "PENDING",
        botPaused: false,
        markRead: true,
      }),
    })
  );
  assert.equal(patchRes.status, 200);
  const patchData = (await patchRes.json()) as {
    conversation: LineChatConversationRecord;
  };
  assert.equal(patchData.conversation.status, "PENDING");
  assert.equal(patchData.conversation.botPaused, false);
  assert.equal(patchData.conversation.unreadCount, 0);

  // Restore OPEN status for clean UI state
  await patchLineChatRoute(
    new Request("http://localhost:3000/api/line/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: samranConv.id,
        status: "OPEN",
      }),
    })
  );

  console.log(
    "  ✓ LINE Omnichannel Chat Inbox (3-Pane CB360 style, Push Reply, Private Note & Bot Handover) passed"
  );
}
