import test from "node:test";
import assert from "node:assert/strict";
import pool from "../src/config/db.js";

const BASE_URL = "http://localhost:3000";

let testAuthorId;
let testBookIsbn;

test.before(async () => {
  const uniqueValue = Date.now();

  const authorResult = await pool.query(
    `INSERT INTO authors (
      first_name,
      last_name,
      biography,
      publisher
    )
    VALUES ($1, $2, $3, $4)
    RETURNING author_id`,
    [
      "Book Details",
      "Test Author",
      "Author created for Book Details API tests.",
      "Test Publisher",
    ],
  );

  testAuthorId = authorResult.rows[0].author_id;

  testBookIsbn = String(uniqueValue).slice(-13).padStart(13, "0");
});

test.after(async () => {
  if (testBookIsbn) {
    await pool.query("DELETE FROM books WHERE isbn = $1", [testBookIsbn]);
  }

  if (testAuthorId) {
    await pool.query("DELETE FROM authors WHERE author_id = $1", [
      testAuthorId,
    ]);
  }

  await pool.end();
});

test("creates an author", async () => {
  const response = await fetch(`${BASE_URL}/authors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      first_name: "Sprint",
      last_name: "Four Author",
      biography: "Created during Book Details testing.",
      publisher: "Geek Text Publishing",
    }),
  });

  assert.equal(response.status, 201);

  const body = await response.json();

  assert.equal(body.first_name, "Sprint");
  assert.equal(body.last_name, "Four Author");

  await pool.query("DELETE FROM authors WHERE author_id = $1", [
    body.author_id,
  ]);
});

test("rejects an author with a missing last name", async () => {
  const response = await fetch(`${BASE_URL}/authors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      first_name: "Missing",
    }),
  });

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(
    body.error,
    "first_name and last_name are required",
  );
});

test("rejects an author with an empty first name", async () => {
  const response = await fetch(`${BASE_URL}/authors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      first_name: "   ",
      last_name: "Author",
    }),
  });

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(
    body.error,
    "first_name and last_name cannot be empty",
  );
});

test("creates a book", async () => {
  const response = await fetch(`${BASE_URL}/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isbn: testBookIsbn,
      name: "Book Details Test Book",
      description: "A book created by the automated Book Details tests.",
      price: 19.99,
      author_id: testAuthorId,
      genre: "Fantasy",
      publisher: "Test Publisher",
      year_published: 2026,
      copies_sold: 100,
    }),
  });

  assert.equal(response.status, 201);

  const body = await response.json();

  assert.equal(body.isbn, testBookIsbn);
  assert.equal(body.name, "Book Details Test Book");
  assert.equal(body.author_id, testAuthorId);
});

test("gets a book by ISBN", async () => {
  const response = await fetch(
    `${BASE_URL}/books/${testBookIsbn}`,
  );

  assert.equal(response.status, 200);

  const body = await response.json();

  assert.equal(body.isbn, testBookIsbn);
  assert.equal(body.name, "Book Details Test Book");
  assert.equal(body.author_id, testAuthorId);
});

test("gets books by author", async () => {
  const response = await fetch(
    `${BASE_URL}/authors/${testAuthorId}/books`,
  );

  assert.equal(response.status, 200);

  const body = await response.json();

  assert.ok(Array.isArray(body));

  const testBook = body.find(
    (book) => book.isbn === testBookIsbn,
  );

  assert.ok(testBook);
  assert.equal(testBook.author_id, testAuthorId);
});

test("rejects duplicate ISBN", async () => {
  const response = await fetch(`${BASE_URL}/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isbn: testBookIsbn,
      name: "Duplicate Book",
      price: 10.99,
      author_id: testAuthorId,
    }),
  });

  assert.equal(response.status, 409);

  const body = await response.json();

  assert.equal(
    body.error,
    "A book with this ISBN already exists",
  );
});

test("rejects a nonexistent author when creating a book", async () => {
  const response = await fetch(`${BASE_URL}/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isbn: "9999999999999",
      name: "Invalid Author Book",
      price: 12.99,
      author_id: 2147483647,
    }),
  });

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(
    body.error,
    "author_id does not reference an existing author",
  );
});

test("rejects an invalid ISBN", async () => {
  const response = await fetch(`${BASE_URL}/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isbn: "12345",
      name: "Invalid ISBN Book",
      price: 9.99,
      author_id: testAuthorId,
    }),
  });

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(
    body.error,
    "isbn must contain exactly 13 digits",
  );
});

test("rejects a negative book price", async () => {
  const response = await fetch(`${BASE_URL}/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isbn: "8888888888888",
      name: "Negative Price Book",
      price: -5,
      author_id: testAuthorId,
    }),
  });

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(
    body.error,
    "price must be a non-negative number",
  );
});

test("returns 404 for a nonexistent book", async () => {
  const response = await fetch(
    `${BASE_URL}/books/7777777777777`,
  );

  assert.equal(response.status, 404);

  const body = await response.json();

  assert.equal(body.error, "Book not found");
});

test("returns 404 for books from a nonexistent author", async () => {
  const response = await fetch(
    `${BASE_URL}/authors/999999999/books`,
  );

  assert.equal(response.status, 404);

  const body = await response.json();

  assert.equal(body.error, "Author not found");
});

test("rejects an invalid author ID", async () => {
  const response = await fetch(
    `${BASE_URL}/authors/0/books`,
  );

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(
    body.error,
    "authorId must be a positive integer",
  );
});