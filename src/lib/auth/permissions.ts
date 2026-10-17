import type { UserRoleType } from "../schemas/auth.schema";

export type AppTab =
  | "WORKSPACE"
  | "EXPLORER"
  | "MASTER_DATA"
  | "USERS"
  | "LINE_OA"
  | "CONTACT";

const ROLE_TAB_MAP: Record<UserRoleType, AppTab[]> = {
  SYSADMIN: [
    "WORKSPACE",
    "EXPLORER",
    "MASTER_DATA",
    "USERS",
    "LINE_OA",
    "CONTACT",
  ],
  ADMIN: ["WORKSPACE", "EXPLORER", "MASTER_DATA", "USERS", "CONTACT"],
  USER: ["WORKSPACE", "EXPLORER", "CONTACT"],
};

export function normalizeUserRole(rawRole?: string | null): UserRoleType {
  if (rawRole === "SYSADMIN") return "SYSADMIN";
  if (rawRole === "ADMIN") return "ADMIN";
  return "USER";
}

export function getAllowedTabsForRole(role: UserRoleType): AppTab[] {
  return ROLE_TAB_MAP[normalizeUserRole(role)];
}

export function canAccessTab(role: UserRoleType, tab: AppTab): boolean {
  return getAllowedTabsForRole(role).includes(tab);
}

export function canManageSystemConfig(role: UserRoleType): boolean {
  return normalizeUserRole(role) === "SYSADMIN";
}

export function canEditContactProfile(role: UserRoleType): boolean {
  const normalized = normalizeUserRole(role);
  return normalized === "SYSADMIN" || normalized === "ADMIN";
}

export function canDeleteDocuments(role: UserRoleType): boolean {
  const normalized = normalizeUserRole(role);
  return normalized === "SYSADMIN" || normalized === "ADMIN";
}

export function getAssignableRoles(actorRole: UserRoleType): UserRoleType[] {
  const normalized = normalizeUserRole(actorRole);
  if (normalized === "SYSADMIN") {
    return ["SYSADMIN", "ADMIN", "USER"];
  }
  if (normalized === "ADMIN") {
    return ["ADMIN", "USER"];
  }
  return [];
}

export function canModifyTargetUser(
  actorRole: UserRoleType,
  targetRole: UserRoleType
): boolean {
  const actor = normalizeUserRole(actorRole);
  const target = normalizeUserRole(targetRole);
  if (actor === "SYSADMIN") return true;
  if (actor === "ADMIN") return target !== "SYSADMIN";
  return false;
}
