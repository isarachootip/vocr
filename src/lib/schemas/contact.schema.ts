import { z } from "zod";

export const DEFAULT_CONTACT_PROFILE = {
  companyName: "ITE Computer",
  tagline:
    "ผู้เชี่ยวชาญด้านระบบเทคโนโลยีสารสนเทศ ซอฟต์แวร์องค์กร และระบบสกัดข้อมูลเอกสารอัจฉริยะ (AI OCR Solutions)",
  phone: "02-XXX-XXXX, 08X-XXX-XXXX",
  email: "contact@itecomputer.com",
  address: "กรุงเทพมหานคร ประเทศไทย",
  businessHours: "จันทร์ - ศุกร์ 08:30 - 17:30 น.",
  websiteUrl: "https://www.itecomputer.com",
  websiteLabel: "www.itecomputer.com",
  lineUrl: "https://lin.ee/zW8Iu4s",
  lineLabel: "@itecomputer",
  facebookUrl: "https://www.facebook.com/itecomputer",
  facebookLabel: "ITE Computer",
  instagramUrl: "https://www.instagram.com/itecomputer",
  instagramLabel: "@itecomputer",
  tiktokUrl: "https://www.tiktok.com/@itecomputer",
  tiktokLabel: "@itecomputer",
} as const;

export const ContactProfileInputSchema = z.object({
  companyName: z.string().trim().min(1, "กรุณาระบุชื่อบริษัท/หน่วยงาน"),
  tagline: z.string().trim().min(1, "กรุณาระบุรายละเอียดบริการ"),
  phone: z.string().trim().min(1, "กรุณาระบุเบอร์โทรศัพท์ติดต่อ"),
  email: z.string().trim().email("กรุณาระบุอีเมลติดต่อที่ถูกต้อง"),
  address: z.string().trim().min(1, "กรุณาระบุที่อยู่"),
  businessHours: z.string().trim().min(1, "กรุณาระบุเวลาทำการ"),
  websiteUrl: z.string().trim().url("กรุณาระบุลิงก์ Website ที่ถูกต้อง (ขึ้นต้นด้วย http:// หรือ https://)"),
  websiteLabel: z.string().trim().min(1, "กรุณาระบุชื่อแสดงผล Website"),
  lineUrl: z.string().trim().url("กรุณาระบุลิงก์ LINE ที่ถูกต้อง (ขึ้นต้นด้วย http:// หรือ https://)"),
  lineLabel: z.string().trim().min(1, "กรุณาระบุ LINE ID หรือชื่อบัญชี LINE"),
  facebookUrl: z.string().trim().url("กรุณาระบุลิงก์ Facebook ที่ถูกต้อง (ขึ้นต้นด้วย http:// หรือ https://)"),
  facebookLabel: z.string().trim().min(1, "กรุณาระบุชื่อเพจ Facebook"),
  instagramUrl: z.string().trim().url("กรุณาระบุลิงก์ Instagram ที่ถูกต้อง (ขึ้นต้นด้วย http:// หรือ https://)"),
  instagramLabel: z.string().trim().min(1, "กรุณาระบุชื่อบัญชี Instagram"),
  tiktokUrl: z.string().trim().url("กรุณาระบุลิงก์ TikTok ที่ถูกต้อง (ขึ้นต้นด้วย http:// หรือ https://)"),
  tiktokLabel: z.string().trim().min(1, "กรุณาระบุชื่อบัญชี TikTok"),
});

export type ContactProfileInput = z.infer<typeof ContactProfileInputSchema>;

export interface ContactProfileRecord extends ContactProfileInput {
  id: string;
  updatedAt: string;
}
