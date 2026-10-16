import { NextResponse } from "next/server";
import {
  getSessionUser,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth/session";
import { LoginInputSchema } from "@/lib/schemas/auth.schema";
import {
  ensureDefaultAdminUser,
  verifyUserCredentials,
} from "@/lib/repositories/user.repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDefaultAdminUser();
    const user = await getSessionUser();
    return NextResponse.json({
      authenticated: Boolean(user),
      user,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "ไม่สามารถตรวจสอบสถานะผู้ใช้งานได้";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = LoginInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "กรุณากรอก User และ Password ให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const user = await verifyUserCredentials(
      parsed.data.username,
      parsed.data.password
    );

    if (!user) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้งาน (User) หรือรหัสผ่าน (Password) ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    await setSessionCookie(user);
    return NextResponse.json({ authenticated: true, user });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ authenticated: false, user: null });
}
