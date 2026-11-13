import test from "node:test";
import assert from "node:assert/strict";
import pool from "../src/config/db.js";

const BASE_URL = "http://localhost:3000";

let testUserId;
let secondTestUserId;
let testAuthorId;
let testBookId;
let wishlistId1;
let wishlistId2;
let wishlistId3;
let secondUserWishlistId;

test.before(async () => {
  const uniqueValue = Date.now();

  // Create primary test user
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

  // Create second test user for cross-user wishlist move tests
  const secondUserResult = await pool.query(
    `INSERT INTO users
      (username, password_hash, name, email_address, home_address)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING user_id`,
    [
      `wishlist_second_test_${uniqueValue}`,
      "testhash",
      "Second Wishlist API Test User",
      `wishlist_second_${uniqueValue}@example.com`,
      "Second Test Address",
    ],
  );

  secondTestUserId = secondUserResult.rows[0].user_id;

  // Create a wishlist owned by the second user
  const secondWishlistResult = await pool.query(
    `INSERT INTO wishlists (user_id, name)
     VALUES ($1, $2)
     RETURNING wishlist_id`,
    [secondTestUserId, "Second User Wishlist"],
  );

  secondUserWishlistId = secondWishlistResult.rows[0].wishlist_id;

  // Create test author
  const authorResult = await pool.query(
    `INSERT INTO authors (first_name, last_name)
     VALUES ($1, $2)
     RETURNING author_id`,
    ["Wishlist", "Test Author"],
  );

  testAuthorId = authorResult.rows[0].author_id;

  // Create test book
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

  if (secondTestUserId) {
    await pool.query("DELETE FROM users WHERE user_id = $1", [
      secondTestUserId,
    ]);
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

test("rejects a zero user ID when creating a wishlist", async () => {
  const response = await fetch(`${BASE_URL}/wishlists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: 0,
      name: "Invalid Wishlist",
    }),
  });

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(body.error, "userId must be a positive integer");
});

test("rejects a whitespace-only wishlist name", async () => {
  const response = await fetch(`${BASE_URL}/wishlists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: testUserId,
      name: "   ",
    }),
  });

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(
    body.error,
    "Wishlist name must be between 1 and 100 characters",
  );
});

test("rejects creating a wishlist name longer than 100 characters", async () => {
  const response = await fetch(`${BASE_URL}/wishlists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: testUserId,
      name: "A".repeat(101),
    }),
  });

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(
    body.error,
    "Wishlist name must be between 1 and 100 characters",
  );
});

test("rejects zero wishlist and book IDs", async () => {
  const response = await fetch(`${BASE_URL}/wishlists/0/books/0`, {
    method: "POST",
  });

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(
    body.error,
    "wishlistId and bookId must be positive integers",
  );
});

test("rejects zero wishlist ID when retrieving books", async () => {
  const response = await fetch(`${BASE_URL}/wishlists/0/books`);

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(body.error, "wishlistId must be a positive integer");
});

test("rejects a whitespace-only wishlist rename", async () => {
  const response = await fetch(`${BASE_URL}/wishlists/${wishlistId2}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "   ",
    }),
  });

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(
    body.error,
    "Wishlist name must be between 1 and 100 characters",
  );
});

test("rejects renaming a wishlist to a name longer than 100 characters", async () => {
  const response = await fetch(`${BASE_URL}/wishlists/${wishlistId2}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "B".repeat(101),
    }),
  });

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(
    body.error,
    "Wishlist name must be between 1 and 100 characters",
  );
});

test("rejects zero user ID when retrieving wishlists", async () => {
  const response = await fetch(`${BASE_URL}/wishlists/user/0`);

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(body.error, "userId must be a positive integer");
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
  const response = await fetch(`${BASE_URL}/wishlists/user/${testUserId}`);

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

test("rejects moving a book to the same wishlist", async () => {
  const response = await fetch(
    `${BASE_URL}/wishlists/${wishlistId1}/books/${testBookId}/move/${wishlistId1}`,
    {
      method: "POST",
    },
  );

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(
    body.error,
    "Source and target wishlist IDs must be different",
  );
});

test("rejects moving a book not in the source wishlist", async () => {
  const response = await fetch(
    `${BASE_URL}/wishlists/${wishlistId2}/books/${testBookId}/move/${wishlistId1}`,
    {
      method: "POST",
    },
  );

  assert.equal(response.status, 404);

  const body = await response.json();

  assert.equal(body.error, "Book not found in source wishlist");
});

test("rejects moving a book between wishlists owned by different users", async () => {
  const response = await fetch(
    `${BASE_URL}/wishlists/${wishlistId1}/books/${testBookId}/move/${secondUserWishlistId}`,
    {
      method: "POST",
    },
  );

  assert.equal(response.status, 403);

  const body = await response.json();

  assert.equal(
    body.error,
    "Books can only be moved between wishlists owned by the same user",
  );
});

test("rejects moving a book already in the target wishlist", async () => {
  const addResponse = await fetch(
    `${BASE_URL}/wishlists/${wishlistId2}/books/${testBookId}`,
    {
      method: "POST",
    },
  );

  assert.equal(addResponse.status, 201);

  const response = await fetch(
    `${BASE_URL}/wishlists/${wishlistId1}/books/${testBookId}/move/${wishlistId2}`,
    {
      method: "POST",
    },
  );

  assert.equal(response.status, 409);

  const body = await response.json();

  assert.equal(body.error, "Book is already in target wishlist");

  const cleanupResponse = await fetch(
    `${BASE_URL}/wishlists/${wishlistId2}/books/${testBookId}`,
    {
      method: "DELETE",
    },
  );

  assert.equal(cleanupResponse.status, 200);
});

test("moves a book between wishlists", async () => {
  const response = await fetch(
    `${BASE_URL}/wishlists/${wishlistId1}/books/${testBookId}/move/${wishlistId2}`,
    {
      method: "POST",
    },
  );

  assert.equal(response.status, 200);

  const body = await response.json();

  assert.equal(body.source_wishlist_id, wishlistId1);
  assert.equal(body.target_wishlist_id, wishlistId2);
  assert.equal(body.book_id, testBookId);

  const sourceResponse = await fetch(
    `${BASE_URL}/wishlists/${wishlistId1}/books`,
  );

  assert.equal(sourceResponse.status, 200);

  const sourceBooks = await sourceResponse.json();

  assert.equal(
    sourceBooks.some((book) => book.book_id === testBookId),
    false,
  );

  const targetResponse = await fetch(
    `${BASE_URL}/wishlists/${wishlistId2}/books`,
  );

  assert.equal(targetResponse.status, 200);

  const targetBooks = await targetResponse.json();

  assert.equal(
    targetBooks.some((book) => book.book_id === testBookId),
    true,
  );
});

test("removes a book from a wishlist", async () => {
  const response = await fetch(
    `${BASE_URL}/wishlists/${wishlistId2}/books/${testBookId}`,
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

test("trims whitespace when renaming a wishlist", async () => {
  const response = await fetch(`${BASE_URL}/wishlists/${wishlistId2}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "   Trimmed Wishlist   ",
    }),
  });

  assert.equal(response.status, 200);

  const body = await response.json();

  assert.equal(body.name, "Trimmed Wishlist");
});