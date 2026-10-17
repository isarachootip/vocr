import { z } from "zod";

export const UserRoleSchema = z.enum(["SYSADMIN", "ADMIN", "USER"]);
export type UserRoleType = z.infer<typeof UserRoleSchema>;

export const LoginInputSchema = z.object({
  username: z.string().trim().min(1, "กรุณาระบุชื่อผู้ใช้งาน (User)"),
  password: z.string().trim().min(1, "กรุณาระบุรหัสผ่าน (Password)"),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const UserCreateInputSchema = z.object({
  username: z.string().trim().min(1, "กรุณาระบุชื่อผู้ใช้งาน (User)"),
  password: z.string().trim().min(1, "กรุณาระบุรหัสผ่าน (Password)"),
  role: UserRoleSchema.default("USER"),
});

export type UserCreateInput = z.infer<typeof UserCreateInputSchema>;

export const UserUpdateInputSchema = z.object({
  id: z.string().min(1, "ไม่พบรหัสผู้ใช้งาน"),
  username: z.string().trim().min(1, "กรุณาระบุชื่อผู้ใช้งาน (User)"),
  password: z.string().trim().min(1, "กรุณาระบุรหัสผ่าน (Password)"),
  role: UserRoleSchema.default("USER"),
});

export type UserUpdateInput = z.infer<typeof UserUpdateInputSchema>;

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRoleType;
}

export interface UserAccountRecord {
  id: string;
  username: string;
  password: string;
  role: UserRoleType;
  createdAt: string;
  updatedAt: string;
}
