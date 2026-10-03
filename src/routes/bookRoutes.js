const express = require('express');
const router = express.Router();
const pool = require('../config/db');





const SORT_FIELDS = {
    price: 'books.price',
    title: 'books.name',
    year: 'books.year_published',
    author: 'authors.last_name',
    genre: 'books.genre'
};

const ALLOWED_PARAMS = new Set(['sort', 'order', 'genre', 'author', 'author_id']);

// GET /books?genre=Fantasy&author=Tolkien&sort=price&order=desc
router.get('/', async (req, res) => {
    // Reject bad parameters like a misspelled "gnere"
    const unknown = Object.keys(req.query).filter(k => !ALLOWED_PARAMS.has(k));
    if (unknown.length > 0) {
        return res.status(400).json({
            error: `Unknown parameter(s): ${unknown.join(', ')}. Allowed: ${[...ALLOWED_PARAMS].join(', ')}`
        });
    }

    // Repeated params (?genre=a&genre=b) need to be plain strings
    for (const [key, value] of Object.entries(req.query)) {
        if (typeof value !== 'string') {
            return res.status(400).json({ error: `Parameter '${key}' must be a single value` });
        }
    }

    const sort = (req.query.sort ?? 'title').toLowerCase();
    const order = (req.query.order ?? 'asc').toLowerCase();

    if (!Object.hasOwn(SORT_FIELDS, sort)) {
        return res.status(400).json({
            error: `Invalid sort field. Use one of: ${Object.keys(SORT_FIELDS).join(', ')}`
        });
    }

    if (order !== 'asc' && order !== 'desc') {
        return res.status(400).json({ error: "Invalid order. Use 'asc' or 'desc'" });
    }

    const conditions = [];
    const params = [];

    if (req.query.genre !== undefined) {
        const genre = req.query.genre.trim();
        if (genre === '') {
            return res.status(400).json({ error: "Parameter 'genre' cannot be empty" });
        }
        params.push(genre);
        conditions.push(`LOWER(books.genre) = LOWER($${params.length})`);
    }

    if (req.query.author_id !== undefined) {
        const raw = req.query.author_id.trim();
        if (!/^\d+$/.test(raw) || Number(raw) > 2147483647) {
            return res.status(400).json({ error: "Parameter 'author_id' must be a postgitive integer" });
        }
        params.push(Number(raw));
        conditions.push(`authors.author_id = $${params.length}`);
    }

    if (req.query.author !== undefined) {
        const author = req.query.author.trim();
        if (author === '') {
            return res.status(400).json({ error: "Parameter 'author' cannot be empty" });
        }
        params.push(author);
        // Case-insensitive "contains" match on the full name
        conditions.push(
            `POSITION(LOWER($${params.length}) IN LOWER(authors.first_name || ' ' || authors.last_name)) > 0`
        );
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
        const result = await pool.query(
            `SELECT
                books.book_id,
                books.isbn,
                books.name,
                books.price::float AS price,
                books.genre,
                books.year_published,
                authors.author_id,
                authors.first_name || ' ' || authors.last_name AS author
            FROM books
            JOIN authors
                ON books.author_id = authors.author_id
            ${where}
            ORDER BY ${SORT_FIELDS[sort]} ${order.toUpperCase()}, books.book_id ASC`,
            params
        );

        // No matches isnt an error so just returns 200 []
        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


// GET book by ISBN
router.get('/:isbn', async (req, res) => {
    const { isbn } = req.params;

    try {
        const result = await pool.query(
            `SELECT
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
                authors.last_name
            FROM books
            JOIN authors
                ON books.author_id = authors.author_id
            WHERE books.isbn = $1`,
            [isbn]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Book not found'
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Server error'
        });
    }
});

module.exports = router;