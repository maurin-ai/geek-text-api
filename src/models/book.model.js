import pool from '../config/db.js';

const BOOK_COLUMNS = `
    books.book_id,
    books.isbn,
    books.name,
    books.description,
    books.price,
    books.genre,
    books.publisher,
    books.year_published,
    books.copies_sold,
    authors.author_id,
    authors.first_name,
    authors.last_name`;

export async function findByIsbn(isbn) {
    const result = await pool.query(
        `SELECT ${BOOK_COLUMNS}
        FROM books
        JOIN authors
            ON books.author_id = authors.author_id
        WHERE books.isbn = $1`,
        [isbn]
    );

    return result.rows[0];
}

export async function findByAuthorId(authorId) {
    const result = await pool.query(
        `SELECT ${BOOK_COLUMNS}
        FROM books
        JOIN authors
            ON books.author_id = authors.author_id
        WHERE authors.author_id = $1`,
        [authorId]
    );

    return result.rows;
}