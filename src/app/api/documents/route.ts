import { NextResponse } from "next/server";
import { getSessionUser, hasRequiredRole } from "@/lib/auth/session";
import { DeliveryDocumentInputSchema } from "@/lib/schemas/document.schema";
import { DocumentFilterSchema } from "@/lib/schemas/master.schema";
import {
  saveDeliveryDocument,
  DuplicateDocumentError,
} from "@/lib/repositories/document.repo";
import {
  listDeliveryDocuments,
  deleteDeliveryDocument,
} from "@/lib/repositories/document-query.repo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterParsed = DocumentFilterSchema.safeParse({
      search: searchParams.get("search") ?? undefined,
      customerCode: searchParams.get("customerCode") ?? undefined,
      materialCode: searchParams.get("materialCode") ?? undefined,
      lotNo: searchParams.get("lotNo") ?? undefined,
      status: searchParams.get("status") ?? "ALL",
      expBefore: searchParams.get("expBefore") ?? undefined,
    });

    const filter = filterParsed.success
      ? filterParsed.data
      : { status: "ALL" as const };

    const documents = await listDeliveryDocuments(filter);
    return NextResponse.json({ documents });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "ไม่สามารถดึงรายการเอกสารได้";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body: unknown = await request.json();
    const parsed = DeliveryDocumentInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "ข้อมูลใบส่งของไม่ผ่านการตรวจสอบ Schema",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    // Role check: UPLOADER can only save as PENDING_REVIEW, REVIEWER/ADMIN can verify
    const docInput = { ...parsed.data };
    if (
      docInput.status === "VERIFIED" &&
      !hasRequiredRole(user, ["REVIEWER", "ADMIN"])
    ) {
      docInput.status = "PENDING_REVIEW";
    }

    const userId = user.id === "default-reviewer" ? null : user.id;
    const saved = await saveDeliveryDocument(docInput, userId);

    return NextResponse.json({ document: saved }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof DuplicateDocumentError) {
      return NextResponse.json(
        {
          error: err.message,
          code: "DUPLICATE_BILLING_NO",
          billingNo: err.billingNo,
          existingId: err.existingId,
        },
        { status: 409 }
      );
    }
    const message =
      err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!hasRequiredRole(user, ["REVIEWER", "ADMIN"])) {
      return NextResponse.json(
        { error: "สิทธิ์ผู้ใช้งานไม่เพียงพอในการลบเอกสาร" },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุ ID เอกสาร" }, { status: 400 });
    }
    await deleteDeliveryDocument(id);
    return NextResponse.json({ deleted: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "ไม่สามารถลบเอกสารได้";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
