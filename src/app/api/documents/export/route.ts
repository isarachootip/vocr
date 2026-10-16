import { NextResponse } from "next/server";
import { listDeliveryDocuments } from "@/lib/repositories/document-query.repo";
import { DocumentFilterSchema } from "@/lib/schemas/master.schema";
import { formatIsoToThaiDate } from "@/lib/domain/thai-date";

function escapeCsvCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterParsed = DocumentFilterSchema.safeParse({
      search: searchParams.get("search") ?? undefined,
      customerCode: searchParams.get("customerCode") ?? undefined,
      lotNo: searchParams.get("lotNo") ?? undefined,
      status: searchParams.get("status") ?? "ALL",
      expBefore: searchParams.get("expBefore") ?? undefined,
    });

    const docs = await listDeliveryDocuments(
      filterParsed.success ? filterParsed.data : { status: "ALL" }
    );

    const headers = [
      "Billing No.",
      "วันที่ Billing (พ.ศ.)",
      "Delivery Order No.",
      "Sales Order No.",
      "รหัสลูกค้า",
      "ชื่อลูกค้า",
      "งบประมาณ",
      "ลำดับสินค้า",
      "รหัสสินค้า",
      "ชื่อสินค้า",
      "Trade Name",
      "GPU",
      "TPU",
      "Lot No.",
      "วันผลิต (พ.ศ.)",
      "วันหมดอายุ (พ.ศ.)",
      "จำนวน (Lot)",
      "หน่วย",
      "ราคาต่อหน่วย",
      "ส่วนลด",
      "จำนวนเงิน (Lot)",
      "ยอดรวมสุทธิทั้งบิล",
      "ผู้รับของ",
      "ผู้ส่งของ",
      "สถานะเอกสาร",
    ];

    const rows: string[] = [headers.map(escapeCsvCell).join(",")];

    for (const doc of docs) {
      for (const item of doc.items) {
        for (const lot of item.lots) {
          rows.push(
            [
              doc.billingNo,
              formatIsoToThaiDate(doc.billingDate),
              doc.deliveryOrderNo ?? "",
              doc.salesOrderNo ?? "",
              doc.customerCode,
              doc.customerName,
              doc.budgetType ?? "",
              item.lineNo,
              item.materialCode,
              item.itemDescription,
              item.tradeName ?? "",
              item.gpuCode ?? "",
              item.tpuCode ?? "",
              lot.lotNo,
              formatIsoToThaiDate(lot.mfgDate),
              formatIsoToThaiDate(lot.expDate),
              lot.qty,
              lot.unit,
              lot.unitPrice,
              lot.discount,
              lot.lotAmount,
              doc.netAmount,
              doc.receiverName ?? "",
              doc.senderName ?? "",
              doc.status,
            ]
              .map(escapeCsvCell)
              .join(",")
          );
        }
      }
    }

    // Prefix UTF-8 BOM (\uFEFF) so Microsoft Excel opens Thai characters accurately
    const csvContent = "\uFEFF" + rows.join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="gpo-delivery-lots-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Export ล้มเหลว";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
