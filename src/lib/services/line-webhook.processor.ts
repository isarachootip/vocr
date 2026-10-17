import { saveOrMergeLineDocument } from "../repositories/document.repo";
import { createOrUpdateLineInboxItem } from "../repositories/line-inbox.repo";
import { validateDeliveryDocument } from "../domain/document-validator";
import type { LineOaConfigRecord, LineWebhookEvent } from "../schemas/line.schema";
import { extractGpoDocumentFromImage } from "./gemini-ocr.service";
import { buildDeliveryDocumentFlexMessage } from "./line-flex.builder";
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

  for (const event of events) {
    if (event.type === "follow" && event.replyToken) {
      await replyLineMessages(
        event.replyToken,
        [
          {
            type: "text",
            text: 'ยินดีต้อนรับสู่ระบบ GPO Delivery Note OCR 🏥\nคุณสามารถกดส่ง "รูปถ่ายใบส่งของ" หรือแนบ "ไฟล์ PDF" เข้ามาในห้องแชทนี้ได้ทันทีโดยไม่ต้องพิมพ์ข้อความ ระบบจะสกัดข้อมูลด้วย AI และตอบกลับสรุปผลอัตโนมัติครับ',
          },
        ],
        config.channelAccessToken
      );
      continue;
    }

    if (event.type !== "message" || !event.message) continue;
    const msgType = event.message.type;

    if (msgType === "image" || msgType === "file") {
      const userId = event.source?.userId ?? null;
      const profile = userId
        ? await fetchLineUserProfile(userId, config.channelAccessToken)
        : null;
      const displayName = profile?.displayName ?? "LINE User";
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
        const base64Data = buffer.toString("base64");
        const dataUrl = `data:${resolvedMime};base64,${base64Data}`;

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
          await replyLineMessages(
            event.replyToken,
            [flexMsg as unknown as Record<string, unknown>],
            config.channelAccessToken
          );
        }
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error ? err.message : "ไม่สามารถอ่านข้อมูลใบส่งของได้";
        await createOrUpdateLineInboxItem({
          lineMessageId: event.message.id,
          messageType: msgType,
          fileName: rawFileName,
          lineUserId: userId,
          lineDisplayName: displayName,
          ocrStatus: "FAILED",
          ocrError: errMsg,
        });

        if (event.replyToken) {
          await replyLineMessages(
            event.replyToken,
            [
              {
                type: "text",
                text: `❌ ระบบไม่สามารถสกัดข้อมูลจากไฟล์ได้: ${errMsg}\nกรุณาส่งภาพถ่ายใบส่งขององค์การเภสัชกรรมหรือไฟล์ PDF ที่เห็นเลขที่ Billing No. ชัดเจน`,
              },
            ],
            config.channelAccessToken
          );
        }
      }
    } else if (msgType === "text" && event.replyToken) {
      await replyLineMessages(
        event.replyToken,
        [
          {
            type: "text",
            text: '📄 ระบบพร้อมรับไฟล์ใบส่งขององค์การเภสัชกรรม (GPO)\nสามารถกดส่ง "รูปภาพ" หรือแนบ "ไฟล์ PDF" เข้ามาในแชทนี้ได้ทันทีครับ',
          },
        ],
        config.channelAccessToken
      );
    }
  }

  return processedDocs;
}
