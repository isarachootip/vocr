import { cookies } from "next/headers";
import { prisma } from "../db/prisma";
import type { SessionUser, UserRoleType } from "../schemas/auth.schema";

const SESSION_COOKIE_NAME = "gpo_ocr_session";

const DEFAULT_SESSION_USER: SessionUser = {
  id: "default-reviewer",
  email: "pharmacist@gpo-ocr.local",
  name: "ภก. ตรวจสอบเอกสาร (Reviewer)",
  role: "REVIEWER",
};

export async function getSessionUser(): Promise<SessionUser> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!raw) {
      return DEFAULT_SESSION_USER;
    }
    const decoded = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf-8")
    ) as SessionUser;
    if (decoded && decoded.email && decoded.role) {
      return decoded;
    }
    return DEFAULT_SESSION_USER;
  } catch {
    return DEFAULT_SESSION_USER;
  }
}

export async function setSessionUser(
  email: string,
  name: string,
  role: UserRoleType
): Promise<SessionUser> {
  const dbUser = await prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: {
      email,
      name,
      role,
      passwordHash: "session-auth",
    },
  });

  const sessionUser: SessionUser = {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
  };

  const cookieStore = await cookies();
  const encoded = Buffer.from(JSON.stringify(sessionUser), "utf-8").toString(
    "base64url"
  );
  cookieStore.set(SESSION_COOKIE_NAME, encoded, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return sessionUser;
}

export function hasRequiredRole(
  user: SessionUser,
  allowedRoles: UserRoleType[]
): boolean {
  return allowedRoles.includes(user.role);
}
