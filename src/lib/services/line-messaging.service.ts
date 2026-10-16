import type { LineBotProfileInfo } from "../schemas/line.schema";

const LINE_API_BASE = "https://api.line.me/v2/bot";
const LINE_DATA_API_BASE = "https://api-data.line.me/v2/bot";

export interface LineConnectionCheckResult {
  connected: boolean;
  bot?: LineBotProfileInfo;
  error?: string;
}

/**
 * Verifies Channel Access Token against LINE Messaging API (/v2/bot/info)
 */
export async function verifyLineBotConnection(
  channelAccessToken: string
): Promise<LineConnectionCheckResult> {
  if (!channelAccessToken.trim()) {
    return { connected: false, error: "ไม่ได้ระบุ Channel Access Token" };
  }

  try {
    const res = await fetch(`${LINE_API_BASE}/info`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${channelAccessToken.trim()}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errBody = await res.text();
      return {
        connected: false,
        error: `LINE API ตอบกลับสถานะ ${res.status}: ${errBody.slice(0, 140)}`,
      };
    }

    const data = (await res.json()) as LineBotProfileInfo;
    return {
      connected: true,
      bot: {
        userId: data.userId,
        basicId: data.basicId,
        displayName: data.displayName,
        pictureUrl: data.pictureUrl,
      },
    };
  } catch (err: unknown) {
    return {
      connected: false,
      error:
        err instanceof Error
          ? err.message
          : "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ LINE API ได้",
    };
  }
}

/**
 * Downloads binary image content sent to LINE OA from messageId
 */
export async function fetchLineMessageContent(
  messageId: string,
  channelAccessToken: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const res = await fetch(
    `${LINE_DATA_API_BASE}/message/${encodeURIComponent(messageId)}/content`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${channelAccessToken.trim()}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`ดึงไฟล์รูปภาพจาก LINE ไม่สำเร็จ (HTTP ${res.status})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const mimeType = res.headers.get("content-type") || "image/jpeg";
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType,
  };
}

/**
 * Fetches sender profile (displayName) from LINE Messaging API
 */
export async function fetchLineUserProfile(
  userId: string,
  channelAccessToken: string
): Promise<{ userId: string; displayName: string } | null> {
  try {
    const res = await fetch(
      `${LINE_API_BASE}/profile/${encodeURIComponent(userId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${channelAccessToken.trim()}`,
        },
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { userId: string; displayName: string };
    return data;
  } catch {
    return null;
  }
}

/**
 * Sends a Reply Message (Text or Flex) back to the user via replyToken
 */
export async function replyLineMessages(
  replyToken: string,
  messages: Array<Record<string, unknown>>,
  channelAccessToken: string
): Promise<boolean> {
  if (!replyToken || replyToken === "00000000000000000000000000000000") {
    // LINE webhook verification dummy token
    return true;
  }

  try {
    const res = await fetch(`${LINE_API_BASE}/message/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken.trim()}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
