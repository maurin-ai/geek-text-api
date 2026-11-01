import test from "node:test";
import assert from "node:assert/strict";
import pool from "../src/config/db.js";

const BASE_URL = "http://localhost:3000";

// A unique genre keeps these tests isolated from seed data and other runs
const uniqueValue = Date.now();
const testGenre = `Browse Test ${uniqueValue}`;

let testAuthorId;
const testBooks = [
  { suffix: "1", name: "Alpha Browsing Book", price: 30.0, year: 2001, sold: 50 },
  { suffix: "2", name: "Bravo Browsing Book", price: 10.0, year: 2015, sold: 900 },
  { suffix: "3", name: "Charlie Browsing Book", price: 20.0, year: 2015, sold: 300 },
];

async function browse(query) {
  const response = await fetch(`${BASE_URL}/books?${query}`);
  const body = await response.json();
  return { response, body };
}

function genreQuery(extra = "") {
  const query = `genre=${encodeURIComponent(testGenre)}`;
  return extra ? `${query}&${extra}` : query;
}

test.before(async () => {
  const authorResult = await pool.query(
    `INSERT INTO authors (first_name, last_name, biography, publisher)
     VALUES ($1, $2, $3, $4)
     RETURNING author_id`,
    [
      "Browsing",
      `Tester${uniqueValue}`,
      "Author created for Book Browsing API tests.",
      "Test Publisher",
    ],
  );

  testAuthorId = authorResult.rows[0].author_id;

  for (const book of testBooks) {
    book.isbn = `${String(uniqueValue).slice(-12)}${book.suffix}`;

    await pool.query(
      `INSERT INTO books
        (isbn, name, price, author_id, genre, year_published, copies_sold)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [book.isbn, book.name, book.price, testAuthorId, testGenre, book.year, book.sold],
    );
  }
});

test.after(async () => {
  await pool.query("DELETE FROM books WHERE genre = $1", [testGenre]);

  if (testAuthorId) {
    await pool.query("DELETE FROM authors WHERE author_id = $1", [testAuthorId]);
  }

  await pool.end();
});

test("filters books by genre case-insensitively", async () => {
  const { response, body } = await browse(
    `genre=${encodeURIComponent(testGenre.toUpperCase())}`,
  );

  assert.equal(response.status, 200);
  assert.equal(body.length, 3);
  assert.ok(body.every((book) => book.genre === testGenre));
});

test("sorts by title ascending by default", async () => {
  const { response, body } = await browse(genreQuery());

  assert.equal(response.status, 200);
  assert.deepEqual(
    body.map((book) => book.name),
    ["Alpha Browsing Book", "Bravo Browsing Book", "Charlie Browsing Book"],
  );
});

test("sorts by price in both directions", async () => {
  const asc = await browse(genreQuery("sort=price&order=asc"));
  const desc = await browse(genreQuery("sort=price&order=desc"));

  assert.deepEqual(asc.body.map((book) => book.price), [10, 20, 30]);
  assert.deepEqual(desc.body.map((book) => book.price), [30, 20, 10]);
});

test("sorts by copies sold descending for top sellers", async () => {
  const { body } = await browse(genreQuery("sort=sold&order=desc"));

  assert.deepEqual(
    body.map((book) => book.isbn),
    [testBooks[1].isbn, testBooks[2].isbn, testBooks[0].isbn],
  );
});

test("accepts sort and order regardless of case and whitespace", async () => {
  const { response, body } = await browse(
    genreQuery("sort=%20PRICE%20&order=DESC"),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(body.map((book) => book.price), [30, 20, 10]);
});

test("breaks sort ties in a stable order", async () => {
  // Bravo and Charlie share 2015, so book_id decides their order
  const first = await browse(genreQuery("sort=year&order=desc"));
  const second = await browse(genreQuery("sort=year&order=desc"));

  assert.deepEqual(first.body.map((book) => book.year_published), [2015, 2015, 2001]);
  assert.deepEqual(
    first.body.map((book) => book.isbn),
    second.body.map((book) => book.isbn),
  );
  assert.ok(first.body[0].book_id < first.body[1].book_id);
});

test("filters by an inclusive price range", async () => {
  const { response, body } = await browse(
    genreQuery("min_price=10&max_price=20&sort=price"),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(body.map((book) => book.price), [10, 20]);
});

test("filters by year range and author_id together", async () => {
  const { body } = await browse(
    genreQuery(`author_id=${testAuthorId}&min_year=2010&max_year=2020`),
  );

  assert.equal(body.length, 2);
  assert.ok(body.every((book) => book.author_id === testAuthorId));
  assert.ok(body.every((book) => book.year_published === 2015));
});

test("searches titles with a partial, case-insensitive match", async () => {
  const { body } = await browse(genreQuery("q=bRAvo"));

  assert.equal(body.length, 1);
  assert.equal(body[0].name, "Bravo Browsing Book");
});

test("paginates results and reports the total count", async () => {
  const { response, body } = await browse(genreQuery("sort=price&limit=2&page=2"));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-total-count"), "3");
  assert.equal(body.length, 1);
  assert.equal(body[0].price, 30);
});

test("returns an empty list when no books match", async () => {
  const { response, body } = await browse(genreQuery("min_price=1000"));

  assert.equal(response.status, 200);
  assert.deepEqual(body, []);
});

test("lists the test genre in /books/genres", async () => {
  const response = await fetch(`${BASE_URL}/books/genres`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(body.includes(testGenre));
});

const badRequests = [
  ["an invalid sort field", "sort=rating", /Invalid sort field/],
  ["an invalid order", "order=sideways", /Invalid order/],
  ["an unknown parameter", "colour=blue", /Unknown parameter\(s\): colour/],
  ["a repeated parameter", "sort=price&sort=title", /must be a single value/],
  ["an empty genre", "genre=%20%20", /'genre' cannot be empty/],
  ["a malformed price", "min_price=abc", /'min_price' must be a price/],
  ["min_price above max_price", "min_price=50&max_price=10", /cannot be greater than 'max_price'/],
  ["min_year above max_year", "min_year=2020&max_year=2000", /cannot be greater than 'max_year'/],
  ["a page of zero", "page=0", /'page' must be a positive integer/],
  ["a limit over 100", "limit=101", /'limit' must be an integer from 1 to 100/],
];

for (const [label, query, expectedError] of badRequests) {
  test(`rejects ${label}`, async () => {
    const { response, body } = await browse(query);

    assert.equal(response.status, 400);
    assert.match(body.error, expectedError);
  });
}
