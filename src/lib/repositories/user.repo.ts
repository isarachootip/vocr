import { prisma } from "../db/prisma";
import { normalizeUserRole } from "../auth/permissions";
import type {
  SessionUser,
  UserAccountRecord,
  UserCreateInput,
  UserRoleType,
  UserUpdateInput,
} from "../schemas/auth.schema";

let roleEnumEnsured = false;

async function ensureUserRoleEnumSchema(): Promise<void> {
  if (roleEnumEnsured) return;
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SYSADMIN';`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'USER';`
    );
    roleEnumEnsured = true;
  } catch {
    // Ignore if already added
  }
}

function toUserRecord(row: {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}): UserAccountRecord {
  return {
    id: row.id,
    username: row.email,
    password: row.passwordHash,
    role: normalizeUserRole(row.role),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const DEFAULT_SEED_USERS: Array<{
  username: string;
  password: string;
  role: UserRoleType;
}> = [
  { username: "sysadmin", password: "1234", role: "SYSADMIN" },
  { username: "admin", password: "1234", role: "ADMIN" },
  { username: "user", password: "1234", role: "USER" },
];

export async function ensureDefaultAdminUser(): Promise<void> {
  await ensureUserRoleEnumSchema();

  for (const seed of DEFAULT_SEED_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: seed.username },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          email: seed.username,
          name: seed.username,
          passwordHash: seed.password,
          role: seed.role,
        },
      });
    } else if (
      seed.username === "sysadmin" &&
      normalizeUserRole(existing.role) !== "SYSADMIN"
    ) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "SYSADMIN" },
      });
    }
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
    role: normalizeUserRole(dbUser.role),
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
  await ensureUserRoleEnumSchema();
  const username = input.username.trim();
  const password = input.password.trim();
  const role = normalizeUserRole(input.role);

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
      role,
    },
  });

  return toUserRecord(created);
}

export async function updateUser(
  input: UserUpdateInput
): Promise<UserAccountRecord> {
  await ensureUserRoleEnumSchema();
  const username = input.username.trim();
  const password = input.password.trim();
  const role = normalizeUserRole(input.role);

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
      role,
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
