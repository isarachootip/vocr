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
  // 1. Ensure default admin user is seeded
  await ensureDefaultAdminUser();
  const initialUsers = await listUsers();
  assert.equal(initialUsers.length >= 1, true);
  assert.ok(initialUsers.some((u) => u.username === "admin"));

  // 2. Verify default admin login
  const adminLogin = await verifyUserCredentials("admin", "1234");
  assert.ok(adminLogin, "Default admin / 1234 should be able to login");
  assert.equal(adminLogin.username, "admin");

  const wrongLogin = await verifyUserCredentials("admin", "wrong-pass");
  assert.equal(wrongLogin, null);

  // 3. Create a new user
  const testUsername = `pharmacist_test_${Date.now()}`;
  const created = await createUser({
    username: testUsername,
    password: "secret123",
  });
  assert.equal(created.username, testUsername);
  assert.equal(created.password, "secret123");

  // 4. Verify login with new user
  const userLogin = await verifyUserCredentials(testUsername, "secret123");
  assert.ok(userLogin);
  assert.equal(userLogin.id, created.id);

  // 5. Update username & password
  const updatedUsername = `${testUsername}_updated`;
  const updated = await updateUser({
    id: created.id,
    username: updatedUsername,
    password: "newpassword999",
  });
  assert.equal(updated.username, updatedUsername);
  assert.equal(updated.password, "newpassword999");

  const updatedLogin = await verifyUserCredentials(
    updatedUsername,
    "newpassword999"
  );
  assert.ok(updatedLogin);

  // 6. Delete the test user
  await deleteUser(created.id);
  const afterDeleteLogin = await verifyUserCredentials(
    updatedUsername,
    "newpassword999"
  );
  assert.equal(afterDeleteLogin, null);

  console.log("  ✓ User CRUD & Password Authentication tests passed");
}
