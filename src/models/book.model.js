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

const SEARCH_COLUMNS = `
    books.book_id,
    books.isbn,
    books.name,
    books.price::float AS price,
    books.genre,
    books.year_published,
    authors.author_id,
    authors.first_name || ' ' || authors.last_name AS author`;

export const SORT_FIELDS = {
    price: 'books.price',
    title: 'books.name',
    year: 'books.year_published',
    author: 'authors.last_name',
    genre: 'books.genre'
};

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

export async function search({ genre, author, authorId, sort, order }) {
    const conditions = [];
    const params = [];

    if (genre !== undefined) {
        params.push(genre);
        conditions.push(`LOWER(books.genre) = LOWER($${params.length})`);
    }

    if (authorId !== undefined) {
        params.push(authorId);
        conditions.push(`authors.author_id = $${params.length}`);
    }

    if (author !== undefined) {
        params.push(author);
        conditions.push(
            `POSITION(LOWER($${params.length}) IN LOWER(authors.first_name || ' ' || authors.last_name)) > 0`
        );
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
        `SELECT ${SEARCH_COLUMNS}
        FROM books
        JOIN authors
            ON books.author_id = authors.author_id
        ${where}
        ORDER BY ${SORT_FIELDS[sort]} ${order.toUpperCase()}, books.book_id ASC`,
        params
    );

    return result.rows;
}
export async function create({
    isbn,
    name,
    description,
    price,
    authorId,
    genre,
    publisher,
    yearPublished,
    copiesSold
}) {
    const result = await pool.query(
        `INSERT INTO books (
            isbn,
            name,
            description,
            price,
            author_id,
            genre,
            publisher,
            year_published,
            copies_sold
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
            isbn,
            name,
            description,
            price,
            authorId,
            genre,
            publisher,
            yearPublished,
            copiesSold
        ]
    );

    return result.rows[0];
}