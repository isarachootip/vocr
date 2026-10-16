import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import type { DocumentFilterInput } from "../schemas/master.schema";

export async function listDeliveryDocuments(filter: DocumentFilterInput) {
  const where: Prisma.DeliveryDocumentWhereInput = {};

  if (filter.status && filter.status !== "ALL") {
    where.status = filter.status;
  }
  if (filter.customerCode) {
    where.customerCode = { contains: filter.customerCode, mode: "insensitive" };
  }
  if (filter.search) {
    const q = filter.search.trim();
    where.OR = [
      { billingNo: { contains: q, mode: "insensitive" } },
      { deliveryOrderNo: { contains: q, mode: "insensitive" } },
      { salesOrderNo: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { customerCode: { contains: q, mode: "insensitive" } },
      { items: { some: { itemDescription: { contains: q, mode: "insensitive" } } } },
      { items: { some: { materialCode: { contains: q, mode: "insensitive" } } } },
      { items: { some: { lots: { some: { lotNo: { contains: q, mode: "insensitive" } } } } } },
    ];
  }
  if (filter.lotNo || filter.expBefore) {
    where.items = {
      some: {
        lots: {
          some: {
            ...(filter.lotNo
              ? { lotNo: { contains: filter.lotNo, mode: "insensitive" } }
              : {}),
            ...(filter.expBefore
              ? { expDate: { lte: new Date(`${filter.expBefore}T23:59:59.000Z`) } }
              : {}),
          },
        },
      },
    };
  }

  return prisma.deliveryDocument.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      pages: { orderBy: { pageNo: "asc" } },
      items: {
        orderBy: { lineNo: "asc" },
        include: { lots: true },
      },
    },
  });
}

export async function deleteDeliveryDocument(id: string) {
  return prisma.deliveryDocument.delete({ where: { id } });
}
