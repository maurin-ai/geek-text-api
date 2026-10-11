import pool from "../config/db.js";

const WISHLIST_BOOK_COLUMNS = `
    books.book_id,
    books.isbn,
    books.name,
    books.description,
    books.price,
    books.author_id,
    books.genre,
    books.publisher,
    books.year_published,
    books.copies_sold`;

export async function exists(wishlistId) {
  const result = await pool.query(
    `SELECT wishlist_id
        FROM wishlists
        WHERE wishlist_id = $1`,
    [wishlistId],
  );

  return result.rows.length > 0;
}

export async function findBooks(wishlistId) {
  const result = await pool.query(
    `SELECT ${WISHLIST_BOOK_COLUMNS}
        FROM wishlist_books
        JOIN books
            ON wishlist_books.book_id = books.book_id
        WHERE wishlist_books.wishlist_id = $1
        ORDER BY books.book_id`,
    [wishlistId],
  );

  return result.rows;
}

export async function create(userId, name) {
  const result = await pool.query(
    `INSERT INTO wishlists (user_id, name)
		VALUES ($1, $2)
		RETURNING wishlist_id, user_id, name`,
    [userId, name],
  );

  return result.rows[0];
}

export async function addBook(wishlistId, bookId) {
  const result = await pool.query(
    `INSERT INTO wishlist_books (wishlist_id, book_id)
VALUES ($1, $2)
RETURNING wishlist_id, book_id`,
    [wishlistId, bookId],
  );

  return result.rows[0];
}

export async function removeBook(wishlistId, bookId) {
  const result = await pool.query(
    `DELETE FROM wishlist_books
WHERE wishlist_id = $1 AND book_id = $2
RETURNING wishlist_id, book_id`,
    [wishlistId, bookId],
  );
  return result.rows[0];
}
export async function remove(wishlistId) {
  const result = await pool.query(
    `DELETE FROM wishlists
WHERE wishlist_id = $1
RETURNING wishlist_id, user_id, name`,
    [wishlistId],
  );
  return result.rows[0];
}
export async function rename(wishlistId, name) {
  const result = await pool.query(
    `UPDATE wishlists
         SET name = $2
         WHERE wishlist_id = $1
         RETURNING wishlist_id, user_id, name`,
    [wishlistId, name],
  );

  return result.rows[0];
}
