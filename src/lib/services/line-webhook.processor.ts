import { saveOrMergeLineDocument } from "../repositories/document.repo";
import { createOrUpdateLineInboxItem } from "../repositories/line-inbox.repo";
import {
  appendLineChatMessage,
  findOrCreateLineConversation,
} from "../repositories/line-chat-mutation.repo";
import { validateDeliveryDocument } from "../domain/document-validator";
import type { LineOaConfigRecord, LineWebhookEvent } from "../schemas/line.schema";
import { extractGpoDocumentFromImage } from "./gemini-ocr.service";
import { buildDeliveryDocumentFlexMessage } from "./line-flex.builder";
import { buildLineQuickReplyItems, generateLineAiReply } from "./line-ai-assistant.service";
import {
  fetchLineMessageContent,
  fetchLineUserProfile,
  replyLineMessages,
} from "./line-messaging.service";

export async function processLineWebhookEvents(
  events: LineWebhookEvent[],
  config: LineOaConfigRecord,
  originUrl: string
): Promise<string[]> {
  const processedDocs: string[] = [];
  const quickReply = { items: buildLineQuickReplyItems() };

  for (const event of events) {
    const userId = event.source?.userId ?? `U_LINE_${Date.now()}`;
    const profile = event.source?.userId
      ? await fetchLineUserProfile(event.source.userId, config.channelAccessToken)
      : null;
    const displayName = profile?.displayName ?? "ผู้ใช้งาน LINE";
    const conv = await findOrCreateLineConversation({ lineUserId: userId, displayName });

    if (event.type === "follow") {
      const welcome = await generateLineAiReply("สวัสดี", displayName);
      await appendLineChatMessage({
        conversationId: conv.id,
        direction: "OUTBOUND",
        senderRole: "BOT",
        senderName: "ITE-SERVICE AI Bot",
        messageType: "text",
        content: welcome.replyText,
      });
      await createOrUpdateLineInboxItem({
        lineMessageId: `follow-${userId}`,
        messageType: "text",
        fileName: "เพิ่มเพื่อนใหม่ / ทักทาย AI",
        lineUserId: userId,
        lineDisplayName: displayName,
        ocrStatus: "COMPLETED",
        billingNo: null,
        customerName: "AI ตอบรับทักทายผู้ใช้งาน",
      });
      if (event.replyToken) {
        await replyLineMessages(
          event.replyToken,
          [{ type: "text", text: welcome.replyText, quickReply }],
          config.channelAccessToken
        );
      }
      continue;
    }

    if (event.type !== "message" || !event.message) continue;
    const msgType = event.message.type;

    if (msgType === "image" || msgType === "file") {
      const rawFileName = event.message.fileName || `line-${event.message.id}.jpg`;
      await createOrUpdateLineInboxItem({
        lineMessageId: event.message.id,
        messageType: msgType,
        fileName: rawFileName,
        lineUserId: userId,
        lineDisplayName: displayName,
        ocrStatus: "PROCESSING",
      });

      try {
        const { buffer, mimeType } = await fetchLineMessageContent(
          event.message.id,
          config.channelAccessToken
        );
        const resolvedMime = rawFileName.toLowerCase().endsWith(".pdf")
          ? "application/pdf"
          : mimeType;
        const dataUrl = `data:${resolvedMime};base64,${buffer.toString("base64")}`;

        const extracted = await extractGpoDocumentFromImage({
          imageBuffer: buffer,
          mimeType: resolvedMime,
          imageUrl: dataUrl,
          fileName: rawFileName,
        });
        const saved = await saveOrMergeLineDocument(extracted.document, {
          lineUserId: userId,
          lineDisplayName: displayName,
        });
        processedDocs.push(saved.billingNo);

        await appendLineChatMessage({
          conversationId: conv.id,
          direction: "INBOUND",
          senderRole: "CUSTOMER",
          senderName: displayName,
          messageType: msgType,
          content: `ส่งไฟล์ใบส่งของ ${rawFileName} (Billing #${saved.billingNo} • ${saved.customerName})`,
          billingNo: saved.billingNo,
          fileUrl: dataUrl,
        });
        await createOrUpdateLineInboxItem({
          lineMessageId: event.message.id,
          messageType: msgType,
          fileName: rawFileName,
          mimeType: resolvedMime,
          fileDataUrl: dataUrl,
          lineUserId: userId,
          lineDisplayName: displayName,
          ocrStatus: "COMPLETED",
          billingNo: saved.billingNo,
          customerName: saved.customerName,
          netAmount: saved.netAmount,
        });

        if (config.autoReplyFlex && event.replyToken) {
          const validation = validateDeliveryDocument(extracted.document);
          const flexMsg = buildDeliveryDocumentFlexMessage(
            extracted.document,
            validation,
            originUrl
          );
          await appendLineChatMessage({
            conversationId: conv.id,
            direction: "OUTBOUND",
            senderRole: "BOT",
            senderName: "ITE-SERVICE AI Bot",
            messageType: "text",
            content: `สกัด OCR สำเร็จ: Billing #${saved.billingNo} (${saved.customerName}) ยอดสุทธิ ${saved.netAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท`,
            billingNo: saved.billingNo,
          });
          await replyLineMessages(
            event.replyToken,
            [{ ...(flexMsg as unknown as Record<string, unknown>), quickReply }],
            config.channelAccessToken
          );
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "ไม่สามารถอ่านข้อมูลใบส่งของได้";
        await createOrUpdateLineInboxItem({
          lineMessageId: event.message.id,
          messageType: msgType,
          fileName: rawFileName,
          lineUserId: userId,
          lineDisplayName: displayName,
          ocrStatus: "FAILED",
          ocrError: errMsg,
        });
      }
    } else if (msgType === "text") {
      const userText = event.message.text || "สวัสดี";
      await appendLineChatMessage({
        conversationId: conv.id,
        direction: "INBOUND",
        senderRole: "CUSTOMER",
        senderName: displayName,
        messageType: "text",
        content: userText,
      });

      if (conv.botPaused) {
        await createOrUpdateLineInboxItem({
          lineMessageId: event.message.id,
          messageType: "text",
          fileName: userText.slice(0, 120),
          lineUserId: userId,
          lineDisplayName: displayName,
          ocrStatus: "COMPLETED",
          billingNo: null,
          customerName: `รอแอดมินตอบกลับ (Bot Paused): "${userText.slice(0, 35)}"`,
        });
        continue;
      }

      const aiReply = await generateLineAiReply(userText, displayName);
      await appendLineChatMessage({
        conversationId: conv.id,
        direction: "OUTBOUND",
        senderRole: "BOT",
        senderName: "ITE-SERVICE AI Bot",
        messageType: "text",
        content: aiReply.replyText,
        billingNo: aiReply.matchedBillingNo,
      });
      await createOrUpdateLineInboxItem({
        lineMessageId: event.message.id,
        messageType: "text",
        fileName: userText.slice(0, 120),
        lineUserId: userId,
        lineDisplayName: displayName,
        ocrStatus: "COMPLETED",
        billingNo: aiReply.matchedBillingNo,
        customerName: `AI ตอบกลับแชท (${userText.slice(0, 35)})`,
      });
      if (event.replyToken) {
        await replyLineMessages(event.replyToken, [{ type: "text", text: aiReply.replyText, quickReply }], config.channelAccessToken);
      }
    }
  }
  return processedDocs;
}
