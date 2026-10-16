import { z } from "zod";

export const UserRoleSchema = z.enum(["UPLOADER", "REVIEWER", "ADMIN"]);
export type UserRoleType = z.infer<typeof UserRoleSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  role: UserRoleSchema.default("REVIEWER"),
  name: z.string().min(1, "กรุณาระบุชื่อผู้ใช้งาน").optional(),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRoleType;
}
