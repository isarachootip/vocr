import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import type { DeliveryDocumentInput } from "../schemas/document.schema";
import { validateDeliveryDocument } from "../domain/document-validator";
import { upsertCustomer, upsertProduct } from "./master-data.repo";

export class DuplicateDocumentError extends Error {
  public readonly billingNo: string;
  public readonly existingId: string;

  constructor(billingNo: string, existingId: string) {
    super(`ใบส่งของเลขที่ Billing No. ${billingNo} มีอยู่ในฐานข้อมูลแล้ว`);
    this.name = "DuplicateDocumentError";
    this.billingNo = billingNo;
    this.existingId = existingId;
  }
}

function toDateOrNull(isoStr: string | null | undefined): Date | null {
  if (!isoStr) return null;
  const parsed = new Date(`${isoStr}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function saveDeliveryDocument(
  input: DeliveryDocumentInput,
  userId?: string | null
) {
  const validationSummary = validateDeliveryDocument(input);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.deliveryDocument.findUnique({
      where: { billingNo: input.billingNo },
      select: { id: true, billingNo: true },
    });

    if (existing && !input.overwriteExisting) {
      throw new DuplicateDocumentError(input.billingNo, existing.id);
    }

    const customer = await upsertCustomer(tx, {
      customerCode: input.customerCode,
      name: input.customerName,
      address: input.customerAddress,
      taxId: input.customerTaxId,
      branch: input.customerBranch,
      customerGroup: input.customerGroup,
    });

    const productMap = new Map<string, string>();
    for (const item of input.items) {
      const product = await upsertProduct(tx, {
        materialCode: item.materialCode,
        description: item.itemDescription,
        tradeName: item.tradeName,
        gpuCode: item.gpuCode,
        tpuCode: item.tpuCode,
        defaultUnit: item.unit,
      });
      productMap.set(item.materialCode, product.id);
    }

    if (existing && input.overwriteExisting) {
      await tx.documentPage.deleteMany({ where: { documentId: existing.id } });
      await tx.documentItem.deleteMany({ where: { documentId: existing.id } });
    }

    const headerData = {
      billingDate: toDateOrNull(input.billingDate),
      poNo: input.poNo,
      poDate: toDateOrNull(input.poDate),
      salesOrderNo: input.salesOrderNo,
      salesOrderDate: toDateOrNull(input.salesOrderDate),
      deliveryOrderNo: input.deliveryOrderNo,
      deliveryOrderDate: toDateOrNull(input.deliveryOrderDate),
      budgetType: input.budgetType,
      docTypeCode: input.docTypeCode,
      customerGroup: input.customerGroup,
      customerId: customer.id,
      customerCode: input.customerCode,
      customerName: input.customerName,
      customerAddress: input.customerAddress,
      customerTaxId: input.customerTaxId,
      customerBranch: input.customerBranch,
      shipToCode: input.shipToCode,
      shipToName: input.shipToName,
      shipToAddress: input.shipToAddress,
      grossAmount: input.grossAmount,
      subtotalExclVat: input.subtotalExclVat,
      vatRate: input.vatRate,
      vatAmount: input.vatAmount,
      netAmount: input.netAmount,
      amountInWords: input.amountInWords,
      hasStamp: input.hasStamp,
      stampOrderNo: input.stampOrderNo,
      stampDate: toDateOrNull(input.stampDate),
      hasReceiverSig: input.hasReceiverSig,
      receiverName: input.receiverName,
      receivedDate: toDateOrNull(input.receivedDate),
      hasSenderSig: input.hasSenderSig,
      senderName: input.senderName,
      sentDate: toDateOrNull(input.sentDate),
      authorizedSigner: input.authorizedSigner,
      status: input.status,
      validationSummary: validationSummary as unknown as Prisma.InputJsonValue,
      uploadedById: userId ?? null,
      verifiedById: input.status === "VERIFIED" ? (userId ?? null) : null,
    };

    const nestedCreates = {
      pages: {
        create: input.pages.map((p) => ({
          pageNo: p.pageNo,
          totalPages: p.totalPages,
          imageUrl: p.imageUrl,
        })),
      },
      items: {
        create: input.items.map((item) => ({
          lineNo: item.lineNo,
          productId: productMap.get(item.materialCode) ?? null,
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
          lots: {
            create: item.lots.map((lot) => ({
              lotNo: lot.lotNo,
              mfgDate: toDateOrNull(lot.mfgDate),
              expDate: toDateOrNull(lot.expDate),
              qty: lot.qty,
              unit: lot.unit,
              unitPrice: lot.unitPrice,
              discount: lot.discount,
              lotAmount: lot.lotAmount,
            })),
          },
        })),
      },
    };

    if (existing) {
      return tx.deliveryDocument.update({
        where: { id: existing.id },
        data: { ...headerData, ...nestedCreates },
        include: { pages: true, items: { include: { lots: true } } },
      });
    }

    return tx.deliveryDocument.create({
      data: {
        billingNo: input.billingNo,
        ...headerData,
        ...nestedCreates,
      },
      include: { pages: true, items: { include: { lots: true } } },
    });
  });
}
