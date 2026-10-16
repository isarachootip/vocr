import type {
  DeliveryDocumentInput,
  ValidationSummary,
} from "../schemas/document.schema";
import { formatIsoToThaiDate } from "../domain/thai-date";

export interface LineFlexMessagePayload {
  type: "flex";
  altText: string;
  contents: Record<string, unknown>;
}

/**
 * Builds a LINE Flex Message summarizing an extracted GPO Delivery Document
 * including Billing No., Customer, Drug Items + Lots, Net Amount, and Validation Status.
 */
export function buildDeliveryDocumentFlexMessage(
  doc: DeliveryDocumentInput,
  validation: ValidationSummary,
  appBaseUrl?: string
): LineFlexMessagePayload {
  const formattedNet = doc.netAmount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const billingThaiDate = formatIsoToThaiDate(doc.billingDate) || "-";
  const pageInfo = `${doc.pages[0]?.pageNo ?? 1}/${doc.pages[0]?.totalPages ?? 1}`;
  const isOk = validation.isValid;

  const itemRows = doc.items.slice(0, 4).map((item) => {
    const lotSummary = item.lots
      .map((l) => `Lot: ${l.lotNo} (${l.qty} ${l.unit})`)
      .join(", ");
    return {
      type: "box",
      layout: "vertical",
      margin: "sm",
      contents: [
        {
          type: "text",
          text: `${item.lineNo}. ${item.itemDescription}`,
          size: "xs",
          weight: "bold",
          color: "#1E293B",
          wrap: true,
        },
        {
          type: "text",
          text: `จำนวนรวม: ${item.totalQty} ${item.unit} | ${lotSummary}`,
          size: "xxs",
          color: "#475569",
          wrap: true,
        },
      ],
    };
  });

  const footerContents: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: isOk
        ? "✅ ตรวจสอบยอดรวม/VAT/Lot ถูกต้อง — บันทึกสถานะรอตรวจสอบ (PENDING_REVIEW)"
        : `⚠️ พบข้อสังเกต ${validation.issues.length} จุด — กรุณาตรวจสอบบนหน้าเว็บ`,
      size: "xxs",
      color: isOk ? "#047857" : "#B45309",
      wrap: true,
    },
  ];

  if (appBaseUrl && appBaseUrl.startsWith("http")) {
    footerContents.push({
      type: "button",
      style: "primary",
      height: "sm",
      color: "#0F766E",
      margin: "md",
      action: {
        type: "uri",
        label: "เปิดดูและตรวจสอบในระบบเว็บ",
        uri: appBaseUrl,
      },
    });
  }

  return {
    type: "flex",
    altText: `รับใบส่งของ GPO Billing #${doc.billingNo} (${doc.customerName}) ยอดสุทธิ ${formattedNet} บาท`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#0F766E",
        paddingAll: "14px",
        contents: [
          {
            type: "text",
            text: "GPO DELIVERY NOTE OCR",
            color: "#99F6E4",
            size: "xxs",
            weight: "bold",
          },
          {
            type: "text",
            text: `Billing No. ${doc.billingNo}`,
            color: "#FFFFFF",
            size: "lg",
            weight: "bold",
          },
          {
            type: "text",
            text: `วันที่: ${billingThaiDate} | หน้า ${pageInfo} | DO: ${doc.deliveryOrderNo ?? "-"}`,
            color: "#E2E8F0",
            size: "xxs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "14px",
        contents: [
          {
            type: "text",
            text: doc.customerName,
            weight: "bold",
            size: "sm",
            color: "#0F172A",
            wrap: true,
          },
          {
            type: "text",
            text: `รหัสลูกค้า: ${doc.customerCode} (${doc.customerBranch ?? "-"})`,
            size: "xxs",
            color: "#64748B",
          },
          { type: "separator", margin: "md" },
          ...itemRows,
          { type: "separator", margin: "md" },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "ยอดชำระสุทธิ (รวม VAT)",
                size: "xs",
                weight: "bold",
                color: "#334155",
              },
              {
                type: "text",
                text: `${formattedNet} ฿`,
                size: "sm",
                weight: "bold",
                color: "#0F766E",
                align: "end",
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "12px",
        backgroundColor: "#F8FAFC",
        contents: footerContents,
      },
    },
  };
}
