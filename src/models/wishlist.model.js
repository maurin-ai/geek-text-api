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
export async function countByUser(userId) {
  const result = await pool.query(
    `SELECT COUNT(*) AS wishlist_count
        FROM wishlists
        WHERE user_id = $1`,
    [userId],
  );

  return Number(result.rows[0].wishlist_count);
}
export async function userExists(userId) {
  const result = await pool.query(
    `SELECT user_id
        FROM users
        WHERE user_id = $1`,
    [userId],
  );

  return result.rows.length > 0;
}
export async function bookExists(bookId) {
  const result = await pool.query(
    `SELECT book_id
        FROM books
        WHERE book_id = $1`,
    [bookId],
  );

  return result.rows.length > 0;
}
export async function findByUser(userId) {
  const result = await pool.query(
    `SELECT wishlist_id, user_id, name
        FROM wishlists
        WHERE user_id = $1
        ORDER BY wishlist_id ASC`,
    [userId],
  );
  return result.rows;
}
export async function moveBook(sourceWishlistId, targetWishlistId, bookId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Confirm both wishlist exist and retrieve their owners.
    const wishlistResult = await client.query(
      `SELECT wishlist_id, user_id
            FROM wishlists
            WHERE wishlist_id IN ($1, $2)`,
      [sourceWishlistId, targetWishlistId],
    );
    if (wishlistResult.rows.length !== 2) {
      await client.query("ROLLBACK");

      return {
        error: "WISHLIST_NOT_FOUND",
      };
    }

    const sourceWishlist = wishlistResult.rows.find(
      (wishlist) => Number(wishlist.wishlist_id) === Number(sourceWishlistId),
    );
    const targetWishlist = wishlistResult.rows.find(
      (wishlist) => Number(wishlist.wishlist_id) === Number(targetWishlistId),
    );
    // A user should only move books between their own wishlists.
    if (sourceWishlist.user_id !== targetWishlist.user_id) {
      await client.query("ROLLBACK");

      return {
        error: "DIFFERENT_USERS",
      };
    }

    // Confirm the book is currently in the source wishlist.
    const bookInSourceResult = await client.query(
      `SELECT wishlist_id, book_id
            FROM wishlist_books
            WHERE wishlist_id = $1 AND book_id = $2`,
      [sourceWishlistId, bookId],
    );
    if (bookInSourceResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return {
        error: "BOOK_NOT_IN_SOURCE",
      };
    }
    // Confirm the destination does not already contain the book.
    const targetBookResult = await client.query(
      `SELECT wishlist_id, book_id
            FROM wishlist_books
            WHERE wishlist_id = $1 AND book_id = $2`,
      [targetWishlistId, bookId],
    );
    if (targetBookResult.rows.length > 0) {
      await client.query("ROLLBACK");

      return {
        error: "BOOK_ALREADY_IN_TARGET",
      };
    }
    // Add to destination first.
    await client.query(
      `INSERT INTO wishlist_books (wishlist_id, book_id)
            VALUES ($1, $2)`,
      [targetWishlistId, bookId],
    );
    // Remove from source.
    await client.query(
      `DELETE FROM wishlist_books
            WHERE wishlist_id = $1 AND book_id = $2`,
      [sourceWishlistId, bookId],
    );

    await client.query("COMMIT");

    return {
      source_wishlist_id:
        Number(sourceWishlistId),
      target_wishlist_id:
        Number(targetWishlistId),
      book_id: Number(bookId),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}