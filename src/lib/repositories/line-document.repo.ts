import { prisma } from "../db/prisma";
import type { DeliveryDocumentInput } from "../schemas/document.schema";
import { mergeMultiPageDocuments } from "../domain/document-merger";
import { saveDeliveryDocument } from "./document.repo";
import { ensureLineDatabaseSchema } from "./line-config.repo";

function toIsoDateStr(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * Saves a GPO Delivery Document received via LINE OA.
 * If a document with the same Billing No. already exists in the database and the incoming
 * image is a different page (e.g., Page 2/2 arriving after Page 1/2), merges the pages and items.
 */
export async function saveOrMergeLineDocument(
  input: DeliveryDocumentInput,
  sender: { lineUserId?: string | null; lineDisplayName?: string | null }
) {
  await ensureLineDatabaseSchema();

  const existing = await prisma.deliveryDocument.findUnique({
    where: { billingNo: input.billingNo },
    include: {
      pages: { orderBy: { pageNo: "asc" } },
      items: {
        orderBy: { lineNo: "asc" },
        include: { lots: true },
      },
    },
  });

  let finalDoc: DeliveryDocumentInput = { ...input };
  const incomingPageNo = input.pages[0]?.pageNo ?? 1;

  if (existing && existing.pages.some((p) => p.pageNo !== incomingPageNo)) {
    const existingInput: DeliveryDocumentInput = {
      billingNo: existing.billingNo,
      billingDate: toIsoDateStr(existing.billingDate),
      poNo: existing.poNo,
      poDate: toIsoDateStr(existing.poDate),
      salesOrderNo: existing.salesOrderNo,
      salesOrderDate: toIsoDateStr(existing.salesOrderDate),
      deliveryOrderNo: existing.deliveryOrderNo,
      deliveryOrderDate: toIsoDateStr(existing.deliveryOrderDate),
      budgetType: existing.budgetType,
      docTypeCode: existing.docTypeCode,
      customerGroup: existing.customerGroup,
      customerCode: existing.customerCode,
      customerName: existing.customerName,
      customerAddress: existing.customerAddress,
      customerTaxId: existing.customerTaxId,
      customerBranch: existing.customerBranch,
      shipToCode: existing.shipToCode,
      shipToName: existing.shipToName,
      shipToAddress: existing.shipToAddress,
      grossAmount: existing.grossAmount,
      subtotalExclVat: existing.subtotalExclVat,
      vatRate: existing.vatRate,
      vatAmount: existing.vatAmount,
      netAmount: existing.netAmount,
      amountInWords: existing.amountInWords,
      hasStamp: existing.hasStamp,
      stampOrderNo: existing.stampOrderNo,
      stampDate: toIsoDateStr(existing.stampDate),
      hasReceiverSig: existing.hasReceiverSig,
      receiverName: existing.receiverName,
      receivedDate: toIsoDateStr(existing.receivedDate),
      hasSenderSig: existing.hasSenderSig,
      senderName: existing.senderName,
      sentDate: toIsoDateStr(existing.sentDate),
      authorizedSigner: existing.authorizedSigner,
      status: "PENDING_REVIEW",
      sourceChannel: "LINE",
      lineUserId: existing.lineUserId,
      lineDisplayName: existing.lineDisplayName,
      overwriteExisting: true,
      pages: existing.pages
        .filter((p) => p.pageNo !== incomingPageNo)
        .map((p) => ({
          pageNo: p.pageNo,
          totalPages: p.totalPages,
          imageUrl: p.imageUrl,
        })),
      items: existing.items.map((item) => ({
        lineNo: item.lineNo,
        materialCode: item.materialCode,
        itemDescription: item.itemDescription,
        tradeName: item.tradeName,
        gpuCode: item.gpuCode,
        tpuCode: item.tpuCode,
        totalQty: item.totalQty,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discount: item.discount,
        lineAmount: item.lineAmount,
        lots: item.lots.map((l) => ({
          lotNo: l.lotNo,
          mfgDate: toIsoDateStr(l.mfgDate),
          expDate: toIsoDateStr(l.expDate),
          qty: l.qty,
          unit: l.unit,
          unitPrice: l.unitPrice,
          discount: l.discount,
          lotAmount: l.lotAmount,
        })),
      })),
    };

    const merged = mergeMultiPageDocuments([existingInput, input]);
    if (merged[0]) {
      finalDoc = merged[0];
    }
  }

  return saveDeliveryDocument(
    {
      ...finalDoc,
      status: "PENDING_REVIEW",
      sourceChannel: "LINE",
      lineUserId: sender.lineUserId ?? null,
      lineDisplayName: sender.lineDisplayName ?? null,
      overwriteExisting: true,
    },
    null
  );
}
