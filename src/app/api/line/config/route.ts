import { NextResponse } from "next/server";
import {
  getLineOaConfig,
  saveLineOaConfig,
} from "@/lib/repositories/line-config.repo";
import { LineOaConfigInputSchema } from "@/lib/schemas/line.schema";
import { verifyLineBotConnection } from "@/lib/services/line-messaging.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shouldVerify = searchParams.get("verify") !== "0";

    const config = await getLineOaConfig();
    const connection = shouldVerify
      ? await verifyLineBotConnection(config.channelAccessToken)
      : null;

    return NextResponse.json({
      config,
      connection,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลตั้งค่า LINE OA ได้";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = LineOaConfigInputSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue =
        parsed.error.issues[0]?.message || "ข้อมูลการตั้งค่า LINE OA ไม่ถูกต้อง";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const saved = await saveLineOaConfig(parsed.data);
    const connection = await verifyLineBotConnection(saved.channelAccessToken);

    return NextResponse.json({
      config: saved,
      connection,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "บันทึกการตั้งค่า LINE OA ไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
