import { NextResponse } from "next/server";
import { getLineOaConfig } from "@/lib/repositories/line-config.repo";
import { saveOrMergeLineDocument } from "@/lib/repositories/document.repo";
import { verifyLineSignature } from "@/lib/domain/line-signature";
import { validateDeliveryDocument } from "@/lib/domain/document-validator";
import { LineWebhookBodySchema } from "@/lib/schemas/line.schema";
import { extractGpoDocumentFromImage } from "@/lib/services/gemini-ocr.service";
import { buildDeliveryDocumentFlexMessage } from "@/lib/services/line-flex.builder";
import {
  fetchLineMessageContent,
  fetchLineUserProfile,
  replyLineMessages,
} from "@/lib/services/line-messaging.service";

export async function GET() {
  const config = await getLineOaConfig();
  return NextResponse.json({
    ok: true,
    channelId: config.channelId,
    oaUrl: config.oaUrl,
    isActive: config.isActive,
    webhookPath: "/api/line/webhook",
  });
}

export async function POST(request: Request) {
  try {
    const config = await getLineOaConfig();
    const originUrl = new URL(request.url).origin;

    // Built-in simulator mode for testing from the LINE Config UI
    const isSimulator = request.headers.get("x-line-simulator") === "1";
    if (isSimulator) {
      const simBody = (await request.json()) as {
        sampleId?: string;
        senderName?: string;
      };
      const sampleId = simBody.sampleId || "sample-4";
      const senderName = simBody.senderName || "ภก. สมชาย (LINE OA)";

      const extracted = await extractGpoDocumentFromImage({
        sampleId,
        imageUrl: `/samples/gpo-${sampleId}.jpg`,
      });
      const saved = await saveOrMergeLineDocument(extracted.document, {
        lineUserId: "U_SIMULATED_LINE_USER",
        lineDisplayName: senderName,
      });
      const validation = validateDeliveryDocument(extracted.document);
      const flexMessage = buildDeliveryDocumentFlexMessage(
        extracted.document,
        validation,
        originUrl
      );

      return NextResponse.json({
        ok: true,
        simulated: true,
        document: saved,
        validation,
        flexMessage,
      });
    }

    if (!config.isActive) {
      return NextResponse.json({
        ok: true,
        skipped: "LINE OA auto-receive is currently disabled",
      });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-line-signature");

    if (!verifyLineSignature(rawBody, signature, config.channelSecret)) {
      return NextResponse.json(
        { error: "Invalid X-Line-Signature" },
        { status: 401 }
      );
    }

    const parsedBody = LineWebhookBodySchema.parse(JSON.parse(rawBody));
    const processedDocs: string[] = [];

    for (const event of parsedBody.events) {
      if (event.type !== "message" || !event.message) continue;

      if (event.message.type === "image") {
        const userId = event.source?.userId ?? null;
        const profile = userId
          ? await fetchLineUserProfile(userId, config.channelAccessToken)
          : null;
        const displayName = profile?.displayName ?? "LINE User";

        try {
          const { buffer, mimeType } = await fetchLineMessageContent(
            event.message.id,
            config.channelAccessToken
          );
          const base64Image = buffer.toString("base64");
          const imageUrl = `data:${mimeType};base64,${base64Image}`;

          const extracted = await extractGpoDocumentFromImage({
            imageBuffer: buffer,
            mimeType,
            imageUrl,
            fileName: `line-${event.message.id}.jpg`,
          });

          await saveOrMergeLineDocument(extracted.document, {
            lineUserId: userId,
            lineDisplayName: displayName,
          });
          processedDocs.push(extracted.document.billingNo);

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
          if (event.replyToken) {
            const errMsg =
              err instanceof Error ? err.message : "ไม่สามารถอ่านข้อมูลใบส่งของได้";
            await replyLineMessages(
              event.replyToken,
              [
                {
                  type: "text",
                  text: `❌ ระบบไม่สามารถสกัดข้อมูลจากรูปภาพได้: ${errMsg}\nกรุณาถ่ายภาพใบส่งขององค์การเภสัชกรรมให้ชัดเจนเห็นเลขที่ Billing No. และตารางรายการยา`,
                },
              ],
              config.channelAccessToken
            );
          }
        }
      } else if (event.message.type === "text" && event.replyToken) {
        await replyLineMessages(
          event.replyToken,
          [
            {
              type: "text",
              text: "📄 ระบบรับใบส่งขององค์การเภสัชกรรม (GPO OCR)\nกรุณาส่งไฟล์รูปภาพใบส่งของในแชทนี้ ระบบจะสกัดข้อมูล ตรวจสอบยอดรวม/Lot และบันทึกเข้าระบบอัตโนมัติทันที",
            },
          ],
          config.channelAccessToken
        );
      }
    }

    return NextResponse.json({
      ok: true,
      processedCount: processedDocs.length,
      billingNos: processedDocs,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "LINE Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
