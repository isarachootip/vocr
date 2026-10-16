import assert from "node:assert/strict";
import { computeLineSignature, verifyLineSignature } from "../../src/lib/domain/line-signature";
import { buildDeliveryDocumentFlexMessage } from "../../src/lib/services/line-flex.builder";
import { GPO_SAMPLE_DOCUMENTS } from "../../src/lib/services/gpo-samples";
import { normalizeRawOcrPayload } from "../../src/lib/services/gpo-prompt";
import { validateDeliveryDocument } from "../../src/lib/domain/document-validator";
import { getLineOaConfig, saveLineOaConfig } from "../../src/lib/repositories/line-config.repo";
import { saveOrMergeLineDocument } from "../../src/lib/repositories/document.repo";
import { DEFAULT_LINE_CONFIG } from "../../src/lib/schemas/line.schema";
import { verifyLineBotConnection } from "../../src/lib/services/line-messaging.service";

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

  // 4. Test LINE Document Upsert & Multi-Page Merge
  const savedLineDoc = await saveOrMergeLineDocument(doc4, {
    lineUserId: "U1234567890abcdef",
    lineDisplayName: "ภก. สมชาย (รพ.ตำรวจ)",
  });
  assert.equal(savedLineDoc.billingNo, "3001275083");
  assert.equal(savedLineDoc.sourceChannel, "LINE");
  assert.equal(savedLineDoc.lineDisplayName, "ภก. สมชาย (รพ.ตำรวจ)");
  assert.equal(savedLineDoc.status, "PENDING_REVIEW");

  console.log("  ✓ LINE OA Signature, Flex Message Builder, Config Repo & Multi-Page Merge passed");
}
