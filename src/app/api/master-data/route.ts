import { NextResponse } from "next/server";
import { getMasterDataOverview } from "@/lib/repositories/master-data.repo";

export async function GET() {
  try {
    const data = await getMasterDataOverview();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูล Master Data ได้";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
