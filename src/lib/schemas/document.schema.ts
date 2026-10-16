import { z } from "zod";

export const DocumentLotSchema = z.object({
  lotNo: z.string().min(1, "กรุณาระบุเลข Lot"),
  mfgDate: z.string().nullable().default(null), // ISO YYYY-MM-DD
  expDate: z.string().nullable().default(null), // ISO YYYY-MM-DD
  qty: z.number().nonnegative(),
  unit: z.string().min(1, "กรุณาระบุหน่วย"),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  lotAmount: z.number().nonnegative(),
});

export type DocumentLotInput = z.infer<typeof DocumentLotSchema>;

export const DocumentItemSchema = z.object({
  lineNo: z.number().int().positive(),
  materialCode: z.string().min(1, "กรุณาระบุรหัสสินค้า"),
  itemDescription: z.string().min(1, "กรุณาระบุชื่อสินค้า"),
  tradeName: z.string().nullable().default(null),
  gpuCode: z.string().nullable().default(null),
  tpuCode: z.string().nullable().default(null),
  totalQty: z.number().positive(),
  unit: z.string().min(1, "กรุณาระบุหน่วย"),
  unitPrice: z.number().nonnegative().nullable().default(null),
  discount: z.number().nonnegative().default(0),
  lineAmount: z.number().nonnegative(),
  lots: z.array(DocumentLotSchema).min(1, "ต้องมีอย่างน้อย 1 Lot"),
});

export type DocumentItemInput = z.infer<typeof DocumentItemSchema>;

export const DocumentPageSchema = z.object({
  pageNo: z.number().int().positive().default(1),
  totalPages: z.number().int().positive().default(1),
  imageUrl: z.string().min(1),
});

export type DocumentPageInput = z.infer<typeof DocumentPageSchema>;

export const ValidationIssueSchema = z.object({
  code: z.string(),
  severity: z.enum(["ERROR", "WARNING"]),
  field: z.string(),
  message: z.string(),
  expected: z.number().optional(),
  actual: z.number().optional(),
});

export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

export const ValidationSummarySchema = z.object({
  isValid: z.boolean(),
  lotQtyMatch: z.boolean(),
  lineMathMatch: z.boolean(),
  grossTotalMatch: z.boolean(),
  vatReconciled: z.boolean(),
  expiryDateValid: z.boolean(),
  issues: z.array(ValidationIssueSchema),
});

export type ValidationSummary = z.infer<typeof ValidationSummarySchema>;

export const DeliveryDocumentInputSchema = z.object({
  billingNo: z.string().min(1, "กรุณาระบุเลขที่ Billing No."),
  billingDate: z.string().nullable().default(null),
  poNo: z.string().nullable().default(null),
  poDate: z.string().nullable().default(null),
  salesOrderNo: z.string().nullable().default(null),
  salesOrderDate: z.string().nullable().default(null),
  deliveryOrderNo: z.string().nullable().default(null),
  deliveryOrderDate: z.string().nullable().default(null),
  budgetType: z.string().nullable().default(null),
  docTypeCode: z.string().nullable().default("ZS01/ZB01"),
  customerGroup: z.string().nullable().default(null),

  customerCode: z.string().min(1, "กรุณาระบุรหัสลูกค้า"),
  customerName: z.string().min(1, "กรุณาระบุชื่อลูกค้า"),
  customerAddress: z.string().default(""),
  customerTaxId: z.string().nullable().default(null),
  customerBranch: z.string().nullable().default(null),

  shipToCode: z.string().nullable().default(null),
  shipToName: z.string().nullable().default(null),
  shipToAddress: z.string().nullable().default(null),

  grossAmount: z.number().nonnegative(),
  subtotalExclVat: z.number().nonnegative(),
  vatRate: z.number().nonnegative().default(7.0),
  vatAmount: z.number().nonnegative(),
  netAmount: z.number().nonnegative(),
  amountInWords: z.string().nullable().default(null),

  hasStamp: z.boolean().default(false),
  stampOrderNo: z.string().nullable().default(null),
  stampDate: z.string().nullable().default(null),
  hasReceiverSig: z.boolean().default(false),
  receiverName: z.string().nullable().default(null),
  receivedDate: z.string().nullable().default(null),
  hasSenderSig: z.boolean().default(false),
  senderName: z.string().nullable().default(null),
  sentDate: z.string().nullable().default(null),
  authorizedSigner: z.string().nullable().default(null),

  status: z.enum(["PENDING_REVIEW", "VERIFIED", "NEEDS_CORRECTION"]).default("VERIFIED"),
  overwriteExisting: z.boolean().default(false),
  pages: z.array(DocumentPageSchema).min(1),
  items: z.array(DocumentItemSchema).min(1),
});

export type DeliveryDocumentInput = z.infer<typeof DeliveryDocumentInputSchema>;
