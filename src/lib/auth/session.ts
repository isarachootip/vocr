import { cookies } from "next/headers";
import { normalizeUserRole } from "./permissions";
import type { SessionUser, UserRoleType } from "../schemas/auth.schema";

const SESSION_COOKIE_NAME = "gpo_ocr_session";

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!raw) {
      return null;
    }
    const decoded = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf-8")
    ) as SessionUser;
    if (decoded && decoded.id && (decoded.username || decoded.email)) {
      return {
        ...decoded,
        username: decoded.username || decoded.email,
        role: normalizeUserRole(decoded.role),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(sessionUser: SessionUser): Promise<void> {
  const cookieStore = await cookies();
  const encoded = Buffer.from(
    JSON.stringify({
      ...sessionUser,
      role: normalizeUserRole(sessionUser.role),
    }),
    "utf-8"
  ).toString("base64url");
  cookieStore.set(SESSION_COOKIE_NAME, encoded, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function hasRequiredRole(
  user: SessionUser | null,
  allowedRoles: UserRoleType[]
): boolean {
  if (!user) return true;
  return allowedRoles.includes(normalizeUserRole(user.role));
}
