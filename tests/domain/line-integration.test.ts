import assert from "node:assert/strict";
import { computeLineSignature, verifyLineSignature } from "../../src/lib/domain/line-signature";
import { buildDeliveryDocumentFlexMessage } from "../../src/lib/services/line-flex.builder";
import { GPO_SAMPLE_DOCUMENTS } from "../../src/lib/services/gpo-samples";
import { normalizeRawOcrPayload } from "../../src/lib/services/gpo-prompt";
import { validateDeliveryDocument } from "../../src/lib/domain/document-validator";
import { getLineOaConfig, saveLineOaConfig } from "../../src/lib/repositories/line-config.repo";
import { saveOrMergeLineDocument } from "../../src/lib/repositories/document.repo";
import {
  createOrUpdateLineInboxItem,
  listLineInboxMessages,
} from "../../src/lib/repositories/line-inbox.repo";
import { DEFAULT_LINE_CONFIG } from "../../src/lib/schemas/line.schema";
import { verifyLineBotConnection } from "../../src/lib/services/line-messaging.service";
import { GET as getConfigRoute } from "../../src/app/api/line/config/route";
import { GET as getInboxRoute } from "../../src/app/api/line/inbox/route";
import { POST as postWebhookRoute } from "../../src/app/api/line/webhook/route";

export async function runLineIntegrationTests(): Promise<void> {
  // 1. Test HMAC-SHA256 LINE Webhook Signature Verification
  const rawBody = JSON.stringify({ events: [{ type: "message" }] });
  const secret = DEFAULT_LINE_CONFIG.channelSecret;
  const validSig = computeLineSignature(rawBody, secret);

  assert.equal(verifyLineSignature(rawBody, validSig, secret), true);
  assert.equal(verifyLineSignature(rawBody, "invalid-signature", secret), false);
  assert.equal(verifyLineSignature(rawBody + "tampered", validSig, secret), false);

  // 2. Test Sample #4 (Billing 3001275083 - โรงพยาบาลตำรวจ Oseltamivir) & Flex Builder
  const sample4 = GPO_SAMPLE_DOCUMENTS.find((s) => s.id === "sample-4");
  assert.ok(sample4, "Sample 4 (3001275083) must be registered");

  const doc4 = normalizeRawOcrPayload(sample4.payload, sample4.imageUrl);
  assert.equal(doc4.billingNo, "3001275083");
  assert.equal(doc4.customerName, "โรงพยาบาลตำรวจ");
  assert.equal(doc4.netAmount, 187500.0);
  assert.equal(doc4.items[0].lots.length, 2);

  const validation4 = validateDeliveryDocument(doc4);
  assert.equal(validation4.isValid, true);

  const flexMsg = buildDeliveryDocumentFlexMessage(doc4, validation4, "https://ocr.example.com");
  assert.equal(flexMsg.type, "flex");
  assert.equal(flexMsg.altText.includes("3001275083"), true);
  const flexStr = JSON.stringify(flexMsg.contents);
  assert.equal(flexStr.includes("โรงพยาบาลตำรวจ"), true);
  assert.equal(flexStr.includes("187,500.00"), true);
  assert.equal(flexStr.includes("K685238"), true);

  // 3. Test LineOaConfig Repository (Default seed + Update) & Live LINE Bot Check
  const initialConfig = await getLineOaConfig();
  assert.equal(initialConfig.channelId, "2012056909");
  assert.equal(initialConfig.channelSecret, "95207e2dcc9d8f795f09d9db03440247");
  assert.equal(initialConfig.oaUrl, "https://lin.ee/zW8Iu4s");

  const updatedConfig = await saveLineOaConfig({
    ...DEFAULT_LINE_CONFIG,
    oaUrl: "https://lin.ee/zW8Iu4s",
    autoReplyFlex: true,
  });
  assert.equal(updatedConfig.channelId, "2012056909");

  const botCheck = await verifyLineBotConnection(updatedConfig.channelAccessToken);
  console.log(
    `  ✓ LINE Bot API check: connected=${botCheck.connected}${
      botCheck.bot ? ` (${botCheck.bot.displayName} ${botCheck.bot.basicId || ""})` : ""
    }`
  );

  // 4. Test LINE Document Upsert & Sequential Multi-Page Merge (Page 1/2 then Page 2/2)
  const savedLineDoc = await saveOrMergeLineDocument(doc4, {
    lineUserId: "U1234567890abcdef",
    lineDisplayName: "ภก. สมชาย (รพ.ตำรวจ)",
  });
  assert.equal(savedLineDoc.billingNo, "3001275083");
  assert.equal(savedLineDoc.sourceChannel, "LINE");
  assert.equal(savedLineDoc.lineDisplayName, "ภก. สมชาย (รพ.ตำรวจ)");
  assert.equal(savedLineDoc.status, "PENDING_REVIEW");

  // Simulate sending Page 1/2 then Page 2/2 in two separate LINE messages
  const multiBillingNo = "3001279999";
  const page1Doc = {
    ...doc4,
    billingNo: multiBillingNo,
    grossAmount: 0,
    subtotalExclVat: 0,
    vatAmount: 0,
    netAmount: 0,
    pages: [{ pageNo: 1, totalPages: 2, imageUrl: "/samples/gpo-sample-4.jpg" }],
    items: [{ ...doc4.items[0], lineNo: 1 }],
  };
  const page2Doc = {
    ...doc4,
    billingNo: multiBillingNo,
    grossAmount: 375000,
    subtotalExclVat: 350467.29,
    vatAmount: 24532.71,
    netAmount: 375000,
    pages: [{ pageNo: 2, totalPages: 2, imageUrl: "/samples/gpo-sample-4.jpg" }],
    items: [
      {
        ...doc4.items[0],
        lineNo: 2,
        materialCode: "110216930999",
        itemDescription: "OSELTAMIVIR SUSPENSION (PAGE 2)",
      },
    ],
  };

  await saveOrMergeLineDocument(page1Doc, {
    lineUserId: "U1234567890abcdef",
    lineDisplayName: "ภก. สมชาย (รพ.ตำรวจ)",
  });
  const mergedSaved = await saveOrMergeLineDocument(page2Doc, {
    lineUserId: "U1234567890abcdef",
    lineDisplayName: "ภก. สมชาย (รพ.ตำรวจ)",
  });
  assert.equal(mergedSaved.pages.length, 2);
  assert.equal(mergedSaved.items.length, 2);
  assert.equal(mergedSaved.netAmount, 375000);

  // 5. Test LINE Inbox Queue & Route Handlers (/api/line/config, /api/line/inbox, /api/line/webhook)
  const inboxEntry = await createOrUpdateLineInboxItem({
    lineMessageId: "line-msg-3001275083",
    messageType: "image",
    fileName: "GPO_3001275083.jpg",
    mimeType: "image/jpeg",
    fileDataUrl: "/samples/gpo-sample-4.jpg",
    lineUserId: "U1234567890abcdef",
    lineDisplayName: "ภก. สมชาย (รพ.ตำรวจ)",
    ocrStatus: "COMPLETED",
    billingNo: "3001275083",
    customerName: "โรงพยาบาลตำรวจ",
    netAmount: 187500.0,
  });
  assert.equal(inboxEntry.ocrStatus, "COMPLETED");
  assert.equal(inboxListCountCheck(await listLineInboxMessages(10)), true);

  const cfgRes = await getConfigRoute(new Request("http://localhost:3000/api/line/config?verify=0"));
  assert.equal(cfgRes.status, 200);

  const inboxRes = await getInboxRoute();
  assert.equal(inboxRes.status, 200);

  const simRes = await postWebhookRoute(
    new Request("http://localhost:3000/api/line/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-line-simulator": "1" },
      body: JSON.stringify({ sampleId: "sample-4", senderName: "ภก. สมชาย (รพ.ตำรวจ)", messageType: "file" }),
    })
  );
  assert.equal(simRes.status, 200);

  console.log("  ✓ LINE OA Signature, Flex Message Builder, Inbox Queue, API Routes & Multi-Page Merge passed");
}

function inboxListCountCheck(list: unknown[]): boolean {
  return list.length >= 1;
}
