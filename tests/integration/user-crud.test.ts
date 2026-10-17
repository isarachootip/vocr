import assert from "node:assert/strict";
import {
  ensureDefaultAdminUser,
  verifyUserCredentials,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../src/lib/repositories/user.repo";

export async function runUserCrudTests(): Promise<void> {
  // 1. Ensure default seed users (sysadmin, admin, user) are created
  await ensureDefaultAdminUser();
  const initialUsers = await listUsers();
  assert.equal(initialUsers.length >= 3, true);
  assert.ok(initialUsers.some((u) => u.username === "sysadmin" && u.role === "SYSADMIN"));
  assert.ok(initialUsers.some((u) => u.username === "admin" && u.role === "ADMIN"));
  assert.ok(initialUsers.some((u) => u.username === "user" && u.role === "USER"));

  // 2. Verify login returns accurate role for each account
  const sysLogin = await verifyUserCredentials("sysadmin", "1234");
  assert.ok(sysLogin);
  assert.equal(sysLogin.role, "SYSADMIN");

  const adminLogin = await verifyUserCredentials("admin", "1234");
  assert.ok(adminLogin, "Default admin / 1234 should be able to login");
  assert.equal(adminLogin.username, "admin");
  assert.equal(adminLogin.role, "ADMIN");

  const stdUserLogin = await verifyUserCredentials("user", "1234");
  assert.ok(stdUserLogin);
  assert.equal(stdUserLogin.role, "USER");

  const wrongLogin = await verifyUserCredentials("admin", "wrong-pass");
  assert.equal(wrongLogin, null);

  // 3. Create a new user with explicit USER role
  const testUsername = `pharmacist_test_${Date.now()}`;
  const created = await createUser({
    username: testUsername,
    password: "secret123",
    role: "USER",
  });
  assert.equal(created.username, testUsername);
  assert.equal(created.password, "secret123");
  assert.equal(created.role, "USER");

  // 4. Verify login with new user returns USER role
  const userLogin = await verifyUserCredentials(testUsername, "secret123");
  assert.ok(userLogin);
  assert.equal(userLogin.id, created.id);
  assert.equal(userLogin.role, "USER");

  // 5. Update username, password & promote role to ADMIN
  const updatedUsername = `${testUsername}_updated`;
  const updated = await updateUser({
    id: created.id,
    username: updatedUsername,
    password: "newpassword999",
    role: "ADMIN",
  });
  assert.equal(updated.username, updatedUsername);
  assert.equal(updated.password, "newpassword999");
  assert.equal(updated.role, "ADMIN");

  const updatedLogin = await verifyUserCredentials(
    updatedUsername,
    "newpassword999"
  );
  assert.ok(updatedLogin);
  assert.equal(updatedLogin.role, "ADMIN");

  // 6. Delete the test user
  await deleteUser(created.id);
  const afterDeleteLogin = await verifyUserCredentials(
    updatedUsername,
    "newpassword999"
  );
  assert.equal(afterDeleteLogin, null);

  console.log("  ✓ User CRUD, Role Assignment & Password Authentication tests passed");
}
