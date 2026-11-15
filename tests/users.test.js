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

function addCard(username, body) {
  return fetch(`${BASE_URL}/users/${username}/credit-cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readCards(username) {
  const result = await pool.query(
    `SELECT credit_cards.*
     FROM credit_cards
     JOIN users ON credit_cards.user_id = users.user_id
     WHERE users.username = $1
     ORDER BY credit_cards.credit_card_id`,
    [username],
  );

  return result.rows;
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

test("POST /users/:username/credit-cards creates a card and returns no content", async () => {
  const username = await createTestUser();

  const response = await addCard(username, {
    cardNumber: "4111111111111111",
    expirationDate: "12/30",
    cvv: "123",
    cardholderName: "Profile Test User",
  });

  assert.equal(response.status, 201);
  assert.equal(await response.text(), "");

  const cards = await readCards(username);

  assert.equal(cards.length, 1);
  assert.equal(cards[0].card_number, "4111111111111111");
  assert.equal(cards[0].expiration_date, "12/30");
  assert.equal(cards[0].cardholder_name, "Profile Test User");
});

test("POST /users/:username/credit-cards never stores the cvv", async () => {
  const username = await createTestUser();

  const response = await addCard(username, {
    cardNumber: "4111111111111111",
    expirationDate: "12/30",
    cvv: "123",
  });

  assert.equal(response.status, 201);

  const [card] = await readCards(username);

  assert.deepEqual(Object.keys(card).sort(), [
    "card_number",
    "cardholder_name",
    "credit_card_id",
    "expiration_date",
    "user_id",
  ]);
});

test("POST /users/:username/credit-cards strips spaces and dashes from the card number", async () => {
  const username = await createTestUser();

  const response = await addCard(username, {
    cardNumber: "4111 1111-1111 1111",
    expirationDate: "12/30",
    cvv: "123",
  });

  assert.equal(response.status, 201);

  const [card] = await readCards(username);

  assert.equal(card.card_number, "4111111111111111");
});

test("POST /users/:username/credit-cards allows a card without a cardholder name", async () => {
  const username = await createTestUser();

  const response = await addCard(username, {
    cardNumber: "4111111111111111",
    expirationDate: "12/30",
    cvv: "123",
  });

  assert.equal(response.status, 201);

  const [card] = await readCards(username);

  assert.equal(card.cardholder_name, null);
});

test("POST /users/:username/credit-cards trims the cardholder name", async () => {
  const username = await createTestUser();

  const response = await addCard(username, {
    cardNumber: "4111111111111111",
    expirationDate: "12/30",
    cvv: "123",
    cardholderName: "   Padded Holder   ",
  });

  assert.equal(response.status, 201);

  const [card] = await readCards(username);

  assert.equal(card.cardholder_name, "Padded Holder");
});

test("POST /users/:username/credit-cards allows several cards for one user", async () => {
  const username = await createTestUser();

  const visa = await addCard(username, {
    cardNumber: "4111111111111111",
    expirationDate: "12/30",
    cvv: "123",
  });
  const amex = await addCard(username, {
    cardNumber: "378282246310005",
    expirationDate: "06/29",
    cvv: "1234",
  });

  assert.equal(visa.status, 201);
  assert.equal(amex.status, 201);

  const cards = await readCards(username);

  assert.deepEqual(
    cards.map((card) => card.card_number),
    ["4111111111111111", "378282246310005"],
  );
});

test("POST /users/:username/credit-cards rejects the same card twice for one user", async () => {
  const username = await createTestUser();
  const card = {
    cardNumber: "4111111111111111",
    expirationDate: "12/30",
    cvv: "123",
  };

  const first = await addCard(username, card);
  const second = await addCard(username, card);
  const body = await second.json();

  assert.equal(first.status, 201);
  assert.equal(second.status, 409);
  assert.equal(body.error, "This credit card is already saved for this user");
  assert.equal((await readCards(username)).length, 1);
});

test("POST /users/:username/credit-cards allows the same card on different users", async () => {
  const firstUser = await createTestUser();
  const secondUser = await createTestUser();
  const card = {
    cardNumber: "5555555555554444",
    expirationDate: "12/30",
    cvv: "123",
  };

  assert.equal((await addCard(firstUser, card)).status, 201);
  assert.equal((await addCard(secondUser, card)).status, 201);
});

test("POST /users/:username/credit-cards rejects missing required fields", async () => {
  const username = await createTestUser();
  const card = {
    cardNumber: "4111111111111111",
    expirationDate: "12/30",
    cvv: "123",
  };

  for (const field of Object.keys(card)) {
    const { [field]: _omitted, ...incomplete } = card;
    const response = await addCard(username, incomplete);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "cardNumber, expirationDate and cvv are required");
  }

  assert.equal((await readCards(username)).length, 0);
});

test("POST /users/:username/credit-cards rejects non-string field values", async () => {
  const username = await createTestUser();

  for (const body of [
    { cardNumber: 4111111111111111, expirationDate: "12/30", cvv: "123" },
    { cardNumber: "4111111111111111", expirationDate: 1230, cvv: "123" },
    { cardNumber: "4111111111111111", expirationDate: "12/30", cvv: 123 },
    { cardNumber: "4111111111111111", expirationDate: "12/30", cvv: "123", cardholderName: 42 },
  ]) {
    const response = await addCard(username, body);

    assert.equal(response.status, 400);
  }
});

test("POST /users/:username/credit-cards rejects card numbers that are not 13 to 19 digits", async () => {
  const username = await createTestUser();

  for (const cardNumber of ["411111111111", "41111111111111111111", "4111abcd11111111", ""]) {
    const response = await addCard(username, {
      cardNumber,
      expirationDate: "12/30",
      cvv: "123",
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "cardNumber must be 13 to 19 digits");
  }
});

test("POST /users/:username/credit-cards rejects a card number that fails the checksum", async () => {
  const username = await createTestUser();

  const response = await addCard(username, {
    cardNumber: "4111111111111112",
    expirationDate: "12/30",
    cvv: "123",
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "cardNumber is not a valid card number");
});

test("POST /users/:username/credit-cards rejects a malformed expiration date", async () => {
  const username = await createTestUser();

  for (const expirationDate of ["13/30", "00/30", "1/30", "2030-12", "12/2030"]) {
    const response = await addCard(username, {
      cardNumber: "4111111111111111",
      expirationDate,
      cvv: "123",
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "expirationDate must be in MM/YY format");
  }
});

test("POST /users/:username/credit-cards rejects an expired card", async () => {
  const username = await createTestUser();

  const response = await addCard(username, {
    cardNumber: "4111111111111111",
    expirationDate: "01/20",
    cvv: "123",
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "Credit card is expired");
});

test("POST /users/:username/credit-cards rejects a cvv that is not 3 or 4 digits", async () => {
  const username = await createTestUser();

  for (const cvv of ["12", "12345", "abc", ""]) {
    const response = await addCard(username, {
      cardNumber: "4111111111111111",
      expirationDate: "12/30",
      cvv,
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "cvv must be 3 or 4 digits");
  }
});

test("POST /users/:username/credit-cards rejects a cardholder name longer than 255 characters", async () => {
  const username = await createTestUser();

  const response = await addCard(username, {
    cardNumber: "4111111111111111",
    expirationDate: "12/30",
    cvv: "123",
    cardholderName: "x".repeat(256),
  });

  assert.equal(response.status, 400);
});

test("POST /users/:username/credit-cards returns 404 for a user that does not exist", async () => {
  const response = await addCard(`missing_user_${Date.now()}`, {
    cardNumber: "4111111111111111",
    expirationDate: "12/30",
    cvv: "123",
  });
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.error, "User not found");
});
