import { listDeliveryDocuments } from "../repositories/document-query.repo";
import { formatIsoToThaiDate } from "../domain/thai-date";

export interface LineQuickReplyButton {
  type: "action";
  action: {
    type: "message" | "camera" | "cameraRoll";
    label: string;
    text?: string;
  };
}

export interface LineAiAssistantReply {
  replyText: string;
  quickReplyItems: LineQuickReplyButton[];
  matchedBillingNo: string | null;
}

export function buildLineQuickReplyItems(): LineQuickReplyButton[] {
  return [
    {
      type: "action",
      action: {
        type: "cameraRoll",
        label: "📄 ส่งรูปใบส่งของ",
      },
    },
    {
      type: "action",
      action: {
        type: "camera",
        label: "📷 ถ่ายภาพใบส่งของ",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "🔍 เช็คสถานะล่าสุด",
        text: "เช็คสถานะเอกสารล่าสุด",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "💊 ข้อมูลยา รพ.ตำรวจ",
        text: "ใบส่งของ โรงพยาบาลตำรวจ ยอดเท่าไหร่และมี Lot อะไรบ้าง",
      },
    },
  ];
}

export async function generateLineAiReply(
  userText: string,
  displayName: string
): Promise<LineAiAssistantReply> {
  const cleanText = userText.trim();
  const lower = cleanText.toLowerCase();
  const docs = await listDeliveryDocuments({ status: "ALL" });
  const quickReplyItems = buildLineQuickReplyItems();

  const pendingCount = docs.filter((d) => d.status === "PENDING_REVIEW").length;
  const verifiedCount = docs.filter((d) => d.status === "VERIFIED").length;

  // 1. Check if user is asking for recent document status
  if (
    lower.includes("เช็คสถานะ") ||
    lower.includes("สถานะเอกสาร") ||
    lower.includes("เอกสารล่าสุด")
  ) {
    const recent = docs.slice(0, 5);
    if (recent.length === 0) {
      return {
        replyText: `สวัสดีครับคุณ ${displayName} ปัจจุบันยังไม่มีใบส่งของในระบบครับ สามารถส่งรูปถ่ายหรือไฟล์ PDF ใบส่งของเข้ามาในแชทนี้ได้เลยครับ`,
        quickReplyItems,
        matchedBillingNo: null,
      };
    }

    const lines = recent.map((d, idx) => {
      const statusBadge =
        d.status === "VERIFIED" ? "✅ ยืนยันแล้ว" : "⏳ รอตรวจสอบ (PENDING_REVIEW)";
      const netStr = d.netAmount.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
      });
      return `${idx + 1}. Billing #${d.billingNo} — ${d.customerName}\n   ยอดสุทธิ: ${netStr} ฿ | ${statusBadge}`;
    });

    return {
      replyText: [
        `📋 สรุปสถานะใบส่งของล่าสุดในระบบ (${recent.length} รายการล่าสุด จากทั้งหมด ${docs.length} ใบ):`,
        "",
        ...lines,
        "",
        "💡ต้องการส่งใบส่งของเพิ่ม กดปุ่มส่งรูป/ไฟล์ PDF หรือพิมพ์เลข Billing No. / ชื่อยา เพื่อถามรายละเอียด AI ได้เลยครับ",
      ].join("\n"),
      quickReplyItems,
      matchedBillingNo: recent[0]?.billingNo ?? null,
    };
  }

  // 2. Check if user is asking about a specific document, hospital, drug, or Lot
  const normalizedQuery = lower
    .replace(/รพ\./g, "โรงพยาบาล")
    .replace(/ใบส่งของ|ยอดเท่าไหร่|และมี|อะไรบ้าง|ราคา|จำนวน|ขอดู|ถาม/g, " ");
  const tokens = normalizedQuery
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !["สวัสดี", "ครับ", "ค่ะ", "วันนี้", "เมนู"].includes(t));

  const matchedDocs = docs.filter((doc) => {
    const searchable = [
      doc.billingNo,
      doc.deliveryOrderNo ?? "",
      doc.customerName,
      doc.customerCode,
      ...doc.items.map(
        (i) =>
          `${i.materialCode} ${i.itemDescription} ${i.tradeName ?? ""} ${i.lots
            .map((l) => l.lotNo)
            .join(" ")}`
      ),
    ]
      .join(" ")
      .toLowerCase();

    return tokens.length > 0 && tokens.some((tk) => searchable.includes(tk));
  });

  if (matchedDocs.length > 0) {
    const details = matchedDocs.slice(0, 3).map((d) => {
      const netStr = d.netAmount.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
      });
      const statusText =
        d.status === "VERIFIED" ? "✅ ยืนยันแล้ว" : "⏳ รอตรวจสอบ";
      const itemLines = d.items.map((item) => {
        const lotInfo = item.lots
          .map(
            (l) =>
              `Lot ${l.lotNo} (${l.qty} ${l.unit}, Exp: ${
                formatIsoToThaiDate(l.expDate?.toISOString().slice(0, 10)) || "-"
              })`
          )
          .join(", ");
        return `   • ${item.itemDescription}: รวม ${item.totalQty} ${item.unit} [${lotInfo}]`;
      });

      return [
        `📄 Billing No. ${d.billingNo} (${statusText})`,
        `🏥 ลูกค้า: ${d.customerName} (รหัส ${d.customerCode})`,
        `💰 ยอดชำระสุทธิ: ${netStr} บาท (VAT 7%: ${d.vatAmount.toLocaleString("th-TH", {
          minimumFractionDigits: 2,
        })} บาท)`,
        ...itemLines,
      ].join("\n");
    });

    return {
      replyText: [
        `🤖 AI ค้นพบข้อมูลใบส่งของที่ตรงกับคำถามของคุณ ${displayName} จำนวน ${matchedDocs.length} รายการครับ:`,
        "",
        details.join("\n\n"),
        "",
        "ต้องการส่งไฟล์ใบส่งของเพิ่ม หรือสอบถามรายการอื่น เลือกจากปุ่มด้านล่างได้เลยครับ 👇",
      ].join("\n"),
      quickReplyItems,
      matchedBillingNo: matchedDocs[0]?.billingNo ?? null,
    };
  }

  // 3. Unified Personalized Greeting & AI Assistant Menu (for both New & Returning Users)
  return {
    replyText: [
      `สวัสดีครับคุณ ${displayName} 👋`,
      "ยินดีต้อนรับสู่ระบบผู้ช่วย AI ใบส่งขององค์การเภสัชกรรม (GPO OCR) วันนี้ต้องการทำรายการใดหรือให้ AI ช่วยเรื่องใดดีครับ?",
      "",
      `📊 ข้อมูลในระบบปัจจุบัน: เอกสารทั้งหมด ${docs.length} ใบ (ยืนยันแล้ว ${verifiedCount} ใบ • รอตรวจสอบ ${pendingCount} ใบ)`,
      "",
      "คุณสามารถเลือกใช้งานได้ทันที:",
      '1️⃣ ส่งไฟล์เข้าระบบ: กดส่ง "รูปภาพ" หรือแนบ "ไฟล์ PDF" ใบส่งของเข้ามาในแชทนี้ได้เลย',
      '2️⃣ เช็คสถานะ: กดปุ่ม "🔍 เช็คสถานะล่าสุด" ด้านล่าง',
      '3️⃣ ถาม AI: พิมพ์ถามชื่อโรงพยาบาล, เลข Billing No., ชื่อยา หรือเลข Lot ได้เลยครับ',
    ].join("\n"),
    quickReplyItems,
    matchedBillingNo: null,
  };
}
