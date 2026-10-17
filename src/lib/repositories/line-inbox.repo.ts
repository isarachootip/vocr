import { prisma } from "../db/prisma";
import type { LineInboxMessageRecord } from "../schemas/line.schema";
import { ensureLineDatabaseSchema } from "./line-config.repo";

function mapInboxRecord(row: {
  id: string;
  lineMessageId: string;
  messageType: string;
  fileName: string | null;
  mimeType: string | null;
  fileDataUrl: string | null;
  lineUserId: string | null;
  lineDisplayName: string;
  ocrStatus: string;
  ocrError: string | null;
  billingNo: string | null;
  customerName: string | null;
  netAmount: number | null;
  createdAt: Date;
}): LineInboxMessageRecord {
  return {
    id: row.id,
    lineMessageId: row.lineMessageId,
    messageType: row.messageType,
    fileName: row.fileName,
    mimeType: row.mimeType,
    fileDataUrl: row.fileDataUrl,
    lineUserId: row.lineUserId,
    lineDisplayName: row.lineDisplayName,
    ocrStatus: (row.ocrStatus as LineInboxMessageRecord["ocrStatus"]) || "PROCESSING",
    ocrError: row.ocrError,
    billingNo: row.billingNo,
    customerName: row.customerName,
    netAmount: row.netAmount,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createOrUpdateLineInboxItem(input: {
  lineMessageId: string;
  messageType: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileDataUrl?: string | null;
  lineUserId?: string | null;
  lineDisplayName: string;
  ocrStatus: "PROCESSING" | "COMPLETED" | "FAILED";
  ocrError?: string | null;
  billingNo?: string | null;
  customerName?: string | null;
  netAmount?: number | null;
}): Promise<LineInboxMessageRecord> {
  await ensureLineDatabaseSchema();

  const saved = await prisma.lineInboxMessage.upsert({
    where: { lineMessageId: input.lineMessageId },
    create: {
      lineMessageId: input.lineMessageId,
      messageType: input.messageType,
      fileName: input.fileName ?? null,
      mimeType: input.mimeType ?? null,
      fileDataUrl: input.fileDataUrl ?? null,
      lineUserId: input.lineUserId ?? null,
      lineDisplayName: input.lineDisplayName,
      ocrStatus: input.ocrStatus,
      ocrError: input.ocrError ?? null,
      billingNo: input.billingNo ?? null,
      customerName: input.customerName ?? null,
      netAmount: input.netAmount ?? null,
    },
    update: {
      ocrStatus: input.ocrStatus,
      ocrError: input.ocrError ?? null,
      billingNo: input.billingNo ?? undefined,
      customerName: input.customerName ?? undefined,
      netAmount: input.netAmount ?? undefined,
    },
  });

  return mapInboxRecord(saved);
}

export async function listLineInboxMessages(
  limit = 30
): Promise<LineInboxMessageRecord[]> {
  await ensureLineDatabaseSchema();
  const rows = await prisma.lineInboxMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapInboxRecord);
}
