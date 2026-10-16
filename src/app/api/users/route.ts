import { NextResponse } from "next/server";
import {
  UserCreateInputSchema,
  UserUpdateInputSchema,
} from "@/lib/schemas/auth.schema";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/repositories/user.repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "ไม่สามารถดึงรายชื่อผู้ใช้งานได้";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = UserCreateInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "กรุณาระบุ User และ Password ให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const user = await createUser(parsed.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "ไม่สามารถสร้างผู้ใช้งานได้";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = UserUpdateInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลสำหรับแก้ไข User / Password ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const user = await updateUser(parsed.data);
    return NextResponse.json({ user });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "ไม่สามารถอัปเดตข้อมูลผู้ใช้งานได้";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "กรุณาระบุรหัสผู้ใช้งานที่ต้องการลบ" },
        { status: 400 }
      );
    }

    await deleteUser(id);
    return NextResponse.json({ deleted: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "ไม่สามารถลบผู้ใช้งานได้";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
