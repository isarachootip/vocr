import { NextResponse } from "next/server";
import {
  getContactProfile,
  saveContactProfile,
} from "@/lib/repositories/contact.repo";
import { ContactProfileInputSchema } from "@/lib/schemas/contact.schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await getContactProfile();
    return NextResponse.json({ profile });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลติดต่อเราได้";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = ContactProfileInputSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue =
        parsed.error.issues[0]?.message || "ข้อมูลการติดต่อไม่ถูกต้อง";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const saved = await saveContactProfile(parsed.data);
    return NextResponse.json({ profile: saved });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "บันทึกข้อมูลติดต่อเราไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
