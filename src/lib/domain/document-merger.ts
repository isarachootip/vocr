import type { DeliveryDocumentInput } from "../schemas/document.schema";

/**
 * Merges multiple extracted pages belonging to the same GPO Billing No.
 * (e.g. Page 1/2 and Page 2/2 uploaded in a batch) into a single consolidated document.
 */
export function mergeMultiPageDocuments(
  docs: DeliveryDocumentInput[]
): DeliveryDocumentInput[] {
  const grouped = new Map<string, DeliveryDocumentInput[]>();

  for (const doc of docs) {
    const key = doc.billingNo.trim();
    const list = grouped.get(key) ?? [];
    list.push(doc);
    grouped.set(key, list);
  }

  const result: DeliveryDocumentInput[] = [];

  for (const [, group] of grouped.entries()) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    // Sort pages by pageNo ascending
    const sorted = [...group].sort((a, b) => {
      const pageA = a.pages[0]?.pageNo ?? 1;
      const pageB = b.pages[0]?.pageNo ?? 1;
      return pageA - pageB;
    });

    const base = { ...sorted[0] };
    const allPages = sorted.flatMap((d) => d.pages);
    const allItems = sorted
      .flatMap((d) => d.items)
      .sort((a, b) => a.lineNo - b.lineNo)
      .map((item, idx) => ({ ...item, lineNo: idx + 1 }));

    // The final page typically holds the summary totals and signatures
    const lastPageWithTotals =
      [...sorted].reverse().find((d) => d.netAmount > 0) ?? sorted[sorted.length - 1];

    const mergedDoc: DeliveryDocumentInput = {
      ...base,
      grossAmount: lastPageWithTotals.grossAmount,
      subtotalExclVat: lastPageWithTotals.subtotalExclVat,
      vatAmount: lastPageWithTotals.vatAmount,
      netAmount: lastPageWithTotals.netAmount,
      amountInWords: lastPageWithTotals.amountInWords ?? base.amountInWords,
      hasStamp: sorted.some((d) => d.hasStamp),
      stampOrderNo: sorted.find((d) => d.stampOrderNo)?.stampOrderNo ?? null,
      stampDate: sorted.find((d) => d.stampDate)?.stampDate ?? null,
      hasReceiverSig: sorted.some((d) => d.hasReceiverSig),
      receiverName: sorted.find((d) => d.receiverName)?.receiverName ?? null,
      receivedDate: sorted.find((d) => d.receivedDate)?.receivedDate ?? null,
      hasSenderSig: sorted.some((d) => d.hasSenderSig),
      senderName: sorted.find((d) => d.senderName)?.senderName ?? null,
      sentDate: sorted.find((d) => d.sentDate)?.sentDate ?? null,
      authorizedSigner: sorted.find((d) => d.authorizedSigner)?.authorizedSigner ?? null,
      pages: allPages,
      items: allItems,
    };

    result.push(mergedDoc);
  }

  return result;
}
