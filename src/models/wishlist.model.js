import pool from '../config/db.js';

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
        [wishlistId]
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
        [wishlistId]
    );

    return result.rows;
}