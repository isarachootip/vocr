import { z } from "zod";

export const CustomerMasterSchema = z.object({
  customerCode: z.string().min(1),
  name: z.string().min(1),
  address: z.string().default(""),
  taxId: z.string().nullable().default(null),
  branch: z.string().nullable().default(null),
  customerGroup: z.string().nullable().default(null),
});

export type CustomerMasterInput = z.infer<typeof CustomerMasterSchema>;

export const ProductMasterSchema = z.object({
  materialCode: z.string().min(1),
  description: z.string().min(1),
  tradeName: z.string().nullable().default(null),
  gpuCode: z.string().nullable().default(null),
  tpuCode: z.string().nullable().default(null),
  defaultUnit: z.string().default("BOX"),
});

export type ProductMasterInput = z.infer<typeof ProductMasterSchema>;

export const DocumentFilterSchema = z.object({
  search: z.string().optional(),
  customerCode: z.string().optional(),
  materialCode: z.string().optional(),
  lotNo: z.string().optional(),
  status: z.enum(["ALL", "PENDING_REVIEW", "VERIFIED", "NEEDS_CORRECTION"]).optional().default("ALL"),
  expBefore: z.string().optional(),
});

export type DocumentFilterInput = z.infer<typeof DocumentFilterSchema>;
