import { NextResponse } from "next/server";
import { listLineInboxMessages } from "@/lib/repositories/line-inbox.repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const messages = await listLineInboxMessages(30);
    return NextResponse.json({ messages });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "ไม่สามารถดึงรายการกล่องรับไฟล์ LINE ได้";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
