import { NextResponse } from "next/server";
import { getSessionUser, hasRequiredRole } from "@/lib/auth/session";
import { canModifyTargetUser, getAssignableRoles } from "@/lib/auth/permissions";
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
    const sessionUser = await getSessionUser();
    if (!hasRequiredRole(sessionUser, ["SYSADMIN", "ADMIN"])) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้งาน" },
        { status: 403 }
      );
    }
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
    const sessionUser = await getSessionUser();
    if (!hasRequiredRole(sessionUser, ["SYSADMIN", "ADMIN"])) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์สร้างผู้ใช้งานใหม่" },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const parsed = UserCreateInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "กรุณาระบุ User, Password และ Role ให้ครบถ้วน" },
        { status: 400 }
      );
    }

    if (
      sessionUser &&
      !getAssignableRoles(sessionUser.role).includes(parsed.data.role)
    ) {
      return NextResponse.json(
        { error: "ไม่สามารถกำหนดสิทธิ์ระดับสูงกว่าสิทธิ์ของคุณได้" },
        { status: 403 }
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
    const sessionUser = await getSessionUser();
    if (!hasRequiredRole(sessionUser, ["SYSADMIN", "ADMIN"])) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้งาน" },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const parsed = UserUpdateInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลสำหรับแก้ไข User / Password / Role ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (
      sessionUser &&
      !canModifyTargetUser(sessionUser.role, parsed.data.role)
    ) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์แก้ไขผู้ใช้งานเป็นระดับ SYSADMIN" },
        { status: 403 }
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
    const sessionUser = await getSessionUser();
    if (!hasRequiredRole(sessionUser, ["SYSADMIN", "ADMIN"])) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ลบผู้ใช้งาน" },
        { status: 403 }
      );
    }

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
