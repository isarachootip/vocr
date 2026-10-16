import { prisma } from "../db/prisma";
import type {
  SessionUser,
  UserAccountRecord,
  UserCreateInput,
  UserUpdateInput,
} from "../schemas/auth.schema";

function toUserRecord(row: {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}): UserAccountRecord {
  return {
    id: row.id,
    username: row.email,
    password: row.passwordHash,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function ensureDefaultAdminUser(): Promise<void> {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin" },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: "admin",
        name: "admin",
        passwordHash: "1234",
        role: "ADMIN",
      },
    });
  }
}

export async function verifyUserCredentials(
  username: string,
  password: string
): Promise<SessionUser | null> {
  await ensureDefaultAdminUser();

  const cleanUsername = username.trim();
  const cleanPassword = password.trim();

  const dbUser = await prisma.user.findUnique({
    where: { email: cleanUsername },
  });

  if (!dbUser || dbUser.passwordHash !== cleanPassword) {
    return null;
  }

  return {
    id: dbUser.id,
    username: dbUser.email,
    email: dbUser.email,
    name: dbUser.name,
    role: "ADMIN",
  };
}

export async function listUsers(): Promise<UserAccountRecord[]> {
  await ensureDefaultAdminUser();
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toUserRecord);
}

export async function createUser(
  input: UserCreateInput
): Promise<UserAccountRecord> {
  const username = input.username.trim();
  const password = input.password.trim();

  const existing = await prisma.user.findUnique({
    where: { email: username },
  });
  if (existing) {
    throw new Error(`ชื่อผู้ใช้งาน "${username}" มีอยู่ในระบบแล้ว`);
  }

  const created = await prisma.user.create({
    data: {
      email: username,
      name: username,
      passwordHash: password,
      role: "ADMIN",
    },
  });

  return toUserRecord(created);
}

export async function updateUser(
  input: UserUpdateInput
): Promise<UserAccountRecord> {
  const username = input.username.trim();
  const password = input.password.trim();

  const conflict = await prisma.user.findFirst({
    where: {
      email: username,
      NOT: { id: input.id },
    },
  });
  if (conflict) {
    throw new Error(`ชื่อผู้ใช้งาน "${username}" ซ้ำกับผู้ใช้อื่นในระบบ`);
  }

  const updated = await prisma.user.update({
    where: { id: input.id },
    data: {
      email: username,
      name: username,
      passwordHash: password,
      role: "ADMIN",
    },
  });

  return toUserRecord(updated);
}

export async function deleteUser(id: string): Promise<void> {
  const count = await prisma.user.count();
  if (count <= 1) {
    throw new Error("ไม่สามารถลบผู้ใช้งานคนสุดท้ายของระบบได้");
  }

  await prisma.$transaction([
    prisma.deliveryDocument.updateMany({
      where: { uploadedById: id },
      data: { uploadedById: null },
    }),
    prisma.deliveryDocument.updateMany({
      where: { verifiedById: id },
      data: { verifiedById: null },
    }),
    prisma.user.delete({
      where: { id },
    }),
  ]);
}
