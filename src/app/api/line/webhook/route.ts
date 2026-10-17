import { NextResponse } from "next/server";
import { getLineOaConfig } from "@/lib/repositories/line-config.repo";
import { saveOrMergeLineDocument } from "@/lib/repositories/document.repo";
import { createOrUpdateLineInboxItem } from "@/lib/repositories/line-inbox.repo";
import { verifyLineSignature } from "@/lib/domain/line-signature";
import { validateDeliveryDocument } from "@/lib/domain/document-validator";
import { LineWebhookBodySchema } from "@/lib/schemas/line.schema";
import { extractGpoDocumentFromImage } from "@/lib/services/gemini-ocr.service";
import { buildDeliveryDocumentFlexMessage } from "@/lib/services/line-flex.builder";
import { processLineWebhookEvents } from "@/lib/services/line-webhook.processor";

export const dynamic = "force-dynamic";

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

    const isSimulator = request.headers.get("x-line-simulator") === "1";
    if (isSimulator) {
      const simBody = (await request.json()) as {
        sampleId?: string;
        senderName?: string;
        messageType?: "image" | "file";
      };
      const sampleId = simBody.sampleId || "sample-4";
      const senderName = simBody.senderName || "ภก. สมชาย (รพ.ตำรวจ)";
      const msgType = simBody.messageType || "image";
      const simMsgId = `sim-${sampleId}-${Date.now()}`;

      const extracted = await extractGpoDocumentFromImage({
        sampleId,
        imageUrl: `/samples/gpo-${sampleId}.jpg`,
      });
      const saved = await saveOrMergeLineDocument(extracted.document, {
        lineUserId: "U_SIMULATED_LINE_USER",
        lineDisplayName: senderName,
      });

      const inboxItem = await createOrUpdateLineInboxItem({
        lineMessageId: simMsgId,
        messageType: msgType,
        fileName: msgType === "file" ? `GPO_${saved.billingNo}.pdf` : `GPO_${saved.billingNo}.jpg`,
        mimeType: msgType === "file" ? "application/pdf" : "image/jpeg",
        fileDataUrl: `/samples/gpo-${sampleId}.jpg`,
        lineUserId: "U_SIMULATED_LINE_USER",
        lineDisplayName: senderName,
        ocrStatus: "COMPLETED",
        billingNo: saved.billingNo,
        customerName: saved.customerName,
        netAmount: saved.netAmount,
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
        inboxItem,
        document: saved,
        validation,
        flexMessage,
      });
    }

    if (!config.isActive) {
      return NextResponse.json({ ok: true, skipped: "LINE OA disabled" });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-line-signature");

    if (!verifyLineSignature(rawBody, signature, config.channelSecret)) {
      return NextResponse.json({ error: "Invalid X-Line-Signature" }, { status: 401 });
    }

    const parsedBody = LineWebhookBodySchema.parse(JSON.parse(rawBody));
    const processedDocs = await processLineWebhookEvents(
      parsedBody.events,
      config,
      originUrl
    );

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
