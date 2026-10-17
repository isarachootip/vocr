import assert from "node:assert/strict";
import {
  normalizeUserRole,
  getAllowedTabsForRole,
  canAccessTab,
  canManageSystemConfig,
  canEditContactProfile,
  canDeleteDocuments,
  getAssignableRoles,
  canModifyTargetUser,
} from "../../src/lib/auth/permissions";

export function runRbacPermissionsTests(): void {
  // 1. Role normalization (including legacy values)
  assert.equal(normalizeUserRole("SYSADMIN"), "SYSADMIN");
  assert.equal(normalizeUserRole("ADMIN"), "ADMIN");
  assert.equal(normalizeUserRole("USER"), "USER");
  assert.equal(normalizeUserRole("REVIEWER"), "USER");
  assert.equal(normalizeUserRole("UPLOADER"), "USER");

  // 2. USER role visibility: sees WORKSPACE, EXPLORER, LINE_INBOX, CONTACT
  const userTabs = getAllowedTabsForRole("USER");
  assert.deepEqual(userTabs, ["WORKSPACE", "EXPLORER", "LINE_INBOX", "CONTACT"]);
  assert.equal(canAccessTab("USER", "WORKSPACE"), true);
  assert.equal(canAccessTab("USER", "EXPLORER"), true);
  assert.equal(canAccessTab("USER", "LINE_INBOX"), true);
  assert.equal(canAccessTab("USER", "CONTACT"), true);
  assert.equal(canAccessTab("USER", "MASTER_DATA"), false);
  assert.equal(canAccessTab("USER", "USERS"), false);
  assert.equal(canAccessTab("USER", "LINE_OA"), false);
  assert.equal(canManageSystemConfig("USER"), false);
  assert.equal(canEditContactProfile("USER"), false);
  assert.equal(canDeleteDocuments("USER"), false);
  assert.deepEqual(getAssignableRoles("USER"), []);

  // 3. ADMIN role visibility: sees WORKSPACE, EXPLORER, MASTER_DATA, USERS, LINE_INBOX, CONTACT (no LINE_OA or Gemini Key)
  const adminTabs = getAllowedTabsForRole("ADMIN");
  assert.deepEqual(adminTabs, [
    "WORKSPACE",
    "EXPLORER",
    "MASTER_DATA",
    "USERS",
    "LINE_INBOX",
    "CONTACT",
  ]);
  assert.equal(canAccessTab("ADMIN", "LINE_INBOX"), true);
  assert.equal(canAccessTab("ADMIN", "LINE_OA"), false);
  assert.equal(canManageSystemConfig("ADMIN"), false);
  assert.equal(canEditContactProfile("ADMIN"), true);
  assert.equal(canDeleteDocuments("ADMIN"), true);
  assert.deepEqual(getAssignableRoles("ADMIN"), ["ADMIN", "USER"]);
  assert.equal(canModifyTargetUser("ADMIN", "USER"), true);
  assert.equal(canModifyTargetUser("ADMIN", "ADMIN"), true);
  assert.equal(canModifyTargetUser("ADMIN", "SYSADMIN"), false);

  // 4. SYSADMIN role visibility: full access to all 7 tabs and system config
  const sysAdminTabs = getAllowedTabsForRole("SYSADMIN");
  assert.deepEqual(sysAdminTabs, [
    "WORKSPACE",
    "EXPLORER",
    "MASTER_DATA",
    "USERS",
    "LINE_INBOX",
    "LINE_OA",
    "CONTACT",
  ]);
  assert.equal(canAccessTab("SYSADMIN", "LINE_INBOX"), true);
  assert.equal(canAccessTab("SYSADMIN", "LINE_OA"), true);
  assert.equal(canManageSystemConfig("SYSADMIN"), true);
  assert.equal(canEditContactProfile("SYSADMIN"), true);
  assert.equal(canDeleteDocuments("SYSADMIN"), true);
  assert.deepEqual(getAssignableRoles("SYSADMIN"), ["SYSADMIN", "ADMIN", "USER"]);
  assert.equal(canModifyTargetUser("SYSADMIN", "SYSADMIN"), true);

  console.log("  ✓ RBAC Permissions Matrix tests passed (SYSADMIN, ADMIN, USER)");
}
