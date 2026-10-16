import crypto from "node:crypto";

/**
 * Computes base64-encoded HMAC-SHA256 signature for LINE Messaging API webhook payloads.
 */
export function computeLineSignature(
  rawBody: string | Buffer,
  channelSecret: string
): string {
  return crypto
    .createHmac("sha256", channelSecret)
    .update(rawBody)
    .digest("base64");
}

/**
 * Verifies X-Line-Signature header using constant-time comparison.
 */
export function verifyLineSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  channelSecret: string
): boolean {
  if (!signatureHeader || !channelSecret) {
    return false;
  }
  const expected = computeLineSignature(rawBody, channelSecret);
  const expectedBuf = Buffer.from(expected, "utf-8");
  const actualBuf = Buffer.from(signatureHeader.trim(), "utf-8");

  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
