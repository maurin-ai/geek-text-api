import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import pool from "../src/config/db.js";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const createdUsernames = [];

async function createTestUser(overrides = {}) {
  const username = `user_test_${Date.now()}_${createdUsernames.length}`;

  const fields = {
    name: "Profile Test User",
    emailAddress: `${username}@example.com`,
    homeAddress: "123 Test Street",
    ...overrides,
  };

  await pool.query(
    `INSERT INTO users
      (username, password_hash, name, email_address, home_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      username,
      await bcrypt.hash("originalPassword", 10),
      fields.name,
      fields.emailAddress,
      fields.homeAddress,
    ],
  );

  createdUsernames.push(username);

  return username;
}

async function readUser(username) {
  const result = await pool.query(
    `SELECT username, name, email_address, home_address, password_hash
     FROM users
     WHERE username = $1`,
    [username],
  );

  return result.rows[0];
}

function patch(username, body, method = "PATCH") {
  return fetch(`${BASE_URL}/users/${username}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test.after(async () => {
  if (createdUsernames.length > 0) {
    await pool.query(`DELETE FROM users WHERE username = ANY($1)`, [
      createdUsernames,
    ]);
  }

  await pool.end();
});

test("PATCH /users/:username updates the name and returns no content", async () => {
  const username = await createTestUser();

  const response = await patch(username, { name: "Updated Name" });

  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");

  const user = await readUser(username);

  assert.equal(user.name, "Updated Name");
});

test("PATCH /users/:username leaves untouched fields alone", async () => {
  const username = await createTestUser();
  const before = await readUser(username);

  const response = await patch(username, { homeAddress: "456 New Avenue" });

  assert.equal(response.status, 204);

  const after = await readUser(username);

  assert.equal(after.home_address, "456 New Avenue");
  assert.equal(after.name, before.name);
  assert.equal(after.email_address, before.email_address);
  assert.equal(after.password_hash, before.password_hash);
});

test("PATCH /users/:username updates several fields at once", async () => {
  const username = await createTestUser();

  const response = await patch(username, {
    name: "Multi Field User",
    homeAddress: "789 Both Fields Lane",
  });

  assert.equal(response.status, 204);

  const user = await readUser(username);

  assert.equal(user.name, "Multi Field User");
  assert.equal(user.home_address, "789 Both Fields Lane");
});

test("PATCH /users/:username trims whitespace from text fields", async () => {
  const username = await createTestUser();

  const response = await patch(username, { name: "   Padded Name   " });

  assert.equal(response.status, 204);

  const user = await readUser(username);

  assert.equal(user.name, "Padded Name");
});

test("PATCH /users/:username rehashes a new password", async () => {
  const username = await createTestUser();
  const before = await readUser(username);

  const response = await patch(username, { password: "brandNewSecret" });

  assert.equal(response.status, 204);

  const after = await readUser(username);

  assert.notEqual(after.password_hash, before.password_hash);
  assert.ok(await bcrypt.compare("brandNewSecret", after.password_hash));
});

test("PATCH /users/:username clears optional fields with null", async () => {
  const username = await createTestUser();

  const response = await patch(username, { homeAddress: null });

  assert.equal(response.status, 204);

  const user = await readUser(username);

  assert.equal(user.home_address, null);
});

test("PATCH /users/:username clears optional fields with a blank string", async () => {
  const username = await createTestUser();

  const response = await patch(username, { name: "   " });

  assert.equal(response.status, 204);

  const user = await readUser(username);

  assert.equal(user.name, null);
});

test("PUT /users/:username applies the same update as PATCH", async () => {
  const username = await createTestUser();

  const response = await patch(username, { name: "Put Verb User" }, "PUT");

  assert.equal(response.status, 204);

  const user = await readUser(username);

  assert.equal(user.name, "Put Verb User");
});

test("PATCH /users/:username rejects an email update", async () => {
  const username = await createTestUser();
  const before = await readUser(username);

  for (const field of ["emailAddress", "email_address", "email"]) {
    const response = await patch(username, { [field]: "new@example.com" });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "emailAddress cannot be updated");
  }

  const after = await readUser(username);

  assert.equal(after.email_address, before.email_address);
});

test("PATCH /users/:username rejects an email update sent alongside a valid field", async () => {
  const username = await createTestUser();
  const before = await readUser(username);

  const response = await patch(username, {
    name: "Should Not Persist",
    emailAddress: "new@example.com",
  });

  assert.equal(response.status, 400);

  const after = await readUser(username);

  assert.equal(after.name, before.name);
  assert.equal(after.email_address, before.email_address);
});

test("PATCH /users/:username rejects a username change", async () => {
  const username = await createTestUser();

  const response = await patch(username, { username: "renamed_user" });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.error, /username/);

  const user = await readUser(username);

  assert.equal(user.username, username);
});

test("PATCH /users/:username rejects unknown fields", async () => {
  const username = await createTestUser();

  const response = await patch(username, { nickname: "Geek" });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.error, /Cannot update/);
});

test("PATCH /users/:username rejects an empty body", async () => {
  const username = await createTestUser();

  const response = await patch(username, {});
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.error, /At least one of/);
});

test("PATCH /users/:username rejects a password shorter than 8 characters", async () => {
  const username = await createTestUser();
  const before = await readUser(username);

  const response = await patch(username, { password: "short" });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "password must be at least 8 characters");

  const after = await readUser(username);

  assert.equal(after.password_hash, before.password_hash);
});

test("PATCH /users/:username rejects non-string field values", async () => {
  const username = await createTestUser();

  for (const body of [{ name: 42 }, { homeAddress: true }, { password: 12345678 }]) {
    const response = await patch(username, body);

    assert.equal(response.status, 400);
  }
});

test("PATCH /users/:username rejects a name longer than 255 characters", async () => {
  const username = await createTestUser();

  const response = await patch(username, { name: "x".repeat(256) });

  assert.equal(response.status, 400);
});

test("PATCH /users/:username rejects a null password", async () => {
  const username = await createTestUser();

  const response = await patch(username, { password: null });

  assert.equal(response.status, 400);
});

test("PATCH /users/:username returns 404 for a user that does not exist", async () => {
  const response = await patch(`missing_user_${Date.now()}`, {
    name: "Nobody",
  });
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.error, "User not found");
});
