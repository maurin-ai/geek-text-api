import test from "node:test";
import assert from "node:assert/strict";
import pool from "../src/config/db.js";

const BASE_URL = "http://localhost:3000";

let testUserId;
let testAuthorId;
let testBookId;
let wishlistId1;
let wishlistId2;
let wishlistId3;

test.before(async () => {
  const uniqueValue = Date.now();

  const userResult = await pool.query(
    `INSERT INTO users
      (username, password_hash, name, email_address, home_address)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING user_id`,
    [
      `wishlist_test_${uniqueValue}`,
      "testhash",
      "Wishlist API Test User",
      `wishlist_${uniqueValue}@example.com`,
      "Test Address",
    ],
  );

  testUserId = userResult.rows[0].user_id;

  const authorResult = await pool.query(
    `INSERT INTO authors (first_name, last_name)
     VALUES ($1, $2)
     RETURNING author_id`,
    ["Wishlist", "Test Author"],
  );

  testAuthorId = authorResult.rows[0].author_id;

  const bookResult = await pool.query(
    `INSERT INTO books
      (isbn, name, price, author_id)
     VALUES ($1, $2, $3, $4)
     RETURNING book_id`,
    [
      String(uniqueValue).slice(-13).padStart(13, "0"),
      "Wishlist API Test Book",
      9.99,
      testAuthorId,
    ],
  );

  testBookId = bookResult.rows[0].book_id;
});

test.after(async () => {
  if (testUserId) {
    await pool.query("DELETE FROM users WHERE user_id = $1", [testUserId]);
  }

  if (testBookId) {
    await pool.query("DELETE FROM books WHERE book_id = $1", [testBookId]);
  }

  if (testAuthorId) {
    await pool.query("DELETE FROM authors WHERE author_id = $1", [
      testAuthorId,
    ]);
  }

  await pool.end();
});

test("creates a wishlist", async () => {
  const response = await fetch(`${BASE_URL}/wishlists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: testUserId,
      name: "Wishlist One",
    }),
  });

  assert.equal(response.status, 201);

  const body = await response.json();

  assert.equal(body.user_id, testUserId);
  assert.equal(body.name, "Wishlist One");

  wishlistId1 = body.wishlist_id;
});

test("rejects duplicate wishlist names", async () => {
  const response = await fetch(`${BASE_URL}/wishlists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: testUserId,
      name: "Wishlist One",
    }),
  });

  assert.equal(response.status, 409);

  const body = await response.json();

  assert.equal(
    body.error,
    "A wishlist with this name already exists for the user",
  );
});

test("creates second and third wishlists", async () => {
  const secondResponse = await fetch(`${BASE_URL}/wishlists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: testUserId,
      name: "Wishlist Two",
    }),
  });

  assert.equal(secondResponse.status, 201);

  const secondBody = await secondResponse.json();
  wishlistId2 = secondBody.wishlist_id;

  const thirdResponse = await fetch(`${BASE_URL}/wishlists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: testUserId,
      name: "Wishlist Three",
    }),
  });

  assert.equal(thirdResponse.status, 201);

  const thirdBody = await thirdResponse.json();
  wishlistId3 = thirdBody.wishlist_id;
});

test("rejects a fourth wishlist", async () => {
  const response = await fetch(`${BASE_URL}/wishlists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: testUserId,
      name: "Wishlist Four",
    }),
  });

  assert.equal(response.status, 409);

  const body = await response.json();

  assert.equal(body.error, "User cannot have more than 3 wishlists");
});

test("rejects a nonexistent user", async () => {
  const response = await fetch(`${BASE_URL}/wishlists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: 2147483647,
      name: "Invalid User Wishlist",
    }),
  });

  assert.equal(response.status, 404);

  const body = await response.json();

  assert.equal(body.error, "User not found");
});

test("adds a book to a wishlist", async () => {
  const response = await fetch(
    `${BASE_URL}/wishlists/${wishlistId1}/books/${testBookId}`,
    {
      method: "POST",
    },
  );

  assert.equal(response.status, 201);

  const body = await response.json();

  assert.equal(body.wishlist_id, wishlistId1);
  assert.equal(body.book_id, testBookId);
});

test("rejects a duplicate book", async () => {
  const response = await fetch(
    `${BASE_URL}/wishlists/${wishlistId1}/books/${testBookId}`,
    {
      method: "POST",
    },
  );

  assert.equal(response.status, 409);

  const body = await response.json();

  assert.equal(body.error, "Book is already in wishlist");
});

test("rejects a nonexistent book", async () => {
  const response = await fetch(
    `${BASE_URL}/wishlists/${wishlistId1}/books/2147483647`,
    {
      method: "POST",
    },
  );

  assert.equal(response.status, 404);

  const body = await response.json();

  assert.equal(body.error, "Book not found");
});

test("gets all wishlists for the user", async () => {
  const response = await fetch(
    `${BASE_URL}/wishlists/user/${testUserId}`,
  );

  assert.equal(response.status, 200);

  const body = await response.json();

  assert.equal(body.length, 3);
});

test("rejects renaming to an existing wishlist name", async () => {
  const response = await fetch(`${BASE_URL}/wishlists/${wishlistId2}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Wishlist One",
    }),
  });

  assert.equal(response.status, 409);

  const body = await response.json();

  assert.equal(
    body.error,
    "A wishlist with this name already exists for the user",
  );
});

test("removes a book from a wishlist", async () => {
  const response = await fetch(
    `${BASE_URL}/wishlists/${wishlistId1}/books/${testBookId}`,
    {
      method: "DELETE",
    },
  );

  assert.equal(response.status, 200);
});

test("deletes a wishlist", async () => {
  const response = await fetch(`${BASE_URL}/wishlists/${wishlistId3}`, {
    method: "DELETE",
  });

  assert.equal(response.status, 200);
});