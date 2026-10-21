import pool from '../config/db.js';
import { buildSetClause } from '../utils/sql.js';

const BOOK_COLUMNS = `
    books.book_id,
    books.isbn,
    books.name,
    books.description,
    books.price::float AS price,
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
    genre: 'books.genre',
    sold: 'books.copies_sold'
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

function buildFilters({ genre, author, authorId, q, minPrice, maxPrice, minYear, maxYear }) {
    const conditions = [];
    const params = [];
    const add = (value, toSql) => {
        params.push(value);
        conditions.push(toSql(`$${params.length}`));
    };

    if (genre !== undefined) add(genre, p => `LOWER(books.genre) = LOWER(${p})`);
    if (authorId !== undefined) add(authorId, p => `authors.author_id = ${p}`);
    if (author !== undefined) {
        add(author, p => `POSITION(LOWER(${p}) IN LOWER(authors.first_name || ' ' || authors.last_name)) > 0`);
    }
    if (q !== undefined) add(q, p => `POSITION(LOWER(${p}) IN LOWER(books.name)) > 0`);
    if (minPrice !== undefined) add(minPrice, p => `books.price >= ${p}`);
    if (maxPrice !== undefined) add(maxPrice, p => `books.price <= ${p}`);
    if (minYear !== undefined) add(minYear, p => `books.year_published >= ${p}`);
    if (maxYear !== undefined) add(maxYear, p => `books.year_published <= ${p}`);

    return {
        where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        params
    };
}

export async function search({ sort, order, limit, offset, ...filters }) {
    const { where, params } = buildFilters(filters);

    let paging = '';
    if (limit !== undefined) {
        params.push(limit, offset ?? 0);
        paging = `LIMIT $${params.length - 1} OFFSET $${params.length}`;
    }

    const result = await pool.query(
        `SELECT ${SEARCH_COLUMNS}
        FROM books
        JOIN authors
            ON books.author_id = authors.author_id
        ${where}
        ORDER BY ${SORT_FIELDS[sort]} ${order.toUpperCase()}, books.book_id ASC
        ${paging}`,
        params
    );

    return result.rows;
}

export async function count(filters) {
    const { where, params } = buildFilters(filters);

    const result = await pool.query(
        `SELECT COUNT(*) AS total
        FROM books
        JOIN authors
            ON books.author_id = authors.author_id
        ${where}`,
        params
    );

    return Number(result.rows[0].total);
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

const BOOK_COLUMN_MAP = {
    name: 'name',
    description: 'description',
    price: 'price',
    authorId: 'author_id',
    genre: 'genre',
    publisher: 'publisher',
    yearPublished: 'year_published',
    copiesSold: 'copies_sold'
};

export async function update(isbn, fields) {
    const { sets, params } = buildSetClause(BOOK_COLUMN_MAP, fields);
    params.push(isbn);

    const result = await pool.query(
        `UPDATE books
        SET ${sets}
        WHERE isbn = $${params.length}
        RETURNING *`,
        params
    );

    return result.rows[0];
}

export async function remove(isbn) {
    const result = await pool.query(
        `DELETE FROM books
        WHERE isbn = $1
        RETURNING book_id, isbn, name`,
        [isbn]
    );

    return result.rows[0];
}

export async function listGenres() {
    const result = await pool.query(
        `SELECT DISTINCT genre
        FROM books
        WHERE genre IS NOT NULL
        ORDER BY genre`
    );

    return result.rows.map(row => row.genre);
}