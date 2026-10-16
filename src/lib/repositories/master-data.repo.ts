import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import type {
  CustomerMasterInput,
  ProductMasterInput,
} from "../schemas/master.schema";

export async function upsertCustomer(
  client: Prisma.TransactionClient | typeof prisma,
  input: CustomerMasterInput
) {
  return client.customer.upsert({
    where: { customerCode: input.customerCode },
    update: {
      name: input.name,
      address: input.address,
      taxId: input.taxId,
      branch: input.branch,
      customerGroup: input.customerGroup,
    },
    create: {
      customerCode: input.customerCode,
      name: input.name,
      address: input.address,
      taxId: input.taxId,
      branch: input.branch,
      customerGroup: input.customerGroup,
    },
  });
}

export async function upsertProduct(
  client: Prisma.TransactionClient | typeof prisma,
  input: ProductMasterInput
) {
  return client.product.upsert({
    where: { materialCode: input.materialCode },
    update: {
      description: input.description,
      tradeName: input.tradeName ?? undefined,
      gpuCode: input.gpuCode ?? undefined,
      tpuCode: input.tpuCode ?? undefined,
      defaultUnit: input.defaultUnit,
    },
    create: {
      materialCode: input.materialCode,
      description: input.description,
      tradeName: input.tradeName,
      gpuCode: input.gpuCode,
      tpuCode: input.tpuCode,
      defaultUnit: input.defaultUnit,
    },
  });
}

export async function getMasterDataOverview() {
  const [customers, products] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { customerCode: "asc" },
      include: {
        _count: { select: { documents: true } },
      },
    }),
    prisma.product.findMany({
      orderBy: { materialCode: "asc" },
      include: {
        _count: { select: { items: true } },
      },
    }),
  ]);

  return { customers, products };
}
