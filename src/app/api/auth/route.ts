import { NextResponse } from "next/server";
import { getSessionUser, setSessionUser } from "@/lib/auth/session";
import { LoginInputSchema } from "@/lib/schemas/auth.schema";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = LoginInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลผู้ใช้งานไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const roleLabels = {
      UPLOADER: "เจ้าหน้าที่อัปโหลด (Uploader)",
      REVIEWER: "เภสัชกรผู้ตรวจสอบ (Reviewer)",
      ADMIN: "ผู้ดูแลระบบ (Admin)",
    } as const;

    const displayName =
      parsed.data.name?.trim() || roleLabels[parsed.data.role];

    const user = await setSessionUser(
      parsed.data.email,
      displayName,
      parsed.data.role
    );

    return NextResponse.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
