import * as Book from '../models/book.model.js';

const ALLOWED_PARAMS = new Set(['sort', 'order', 'genre', 'author', 'author_id']);
const MAX_INTEGER = 2147483647;

export async function search(req, res) {
    const unknown = Object.keys(req.query).filter(key => !ALLOWED_PARAMS.has(key));

    if (unknown.length > 0) {
        return res.status(400).json({
            error: `Unknown parameter(s): ${unknown.join(', ')}. Allowed: ${[...ALLOWED_PARAMS].join(', ')}`
        });
    }

    for (const [key, value] of Object.entries(req.query)) {
        if (typeof value !== 'string') {
            return res.status(400).json({
                error: `Parameter '${key}' must be a single value`
            });
        }
    }

    const sort = (req.query.sort ?? 'title').toLowerCase();
    const order = (req.query.order ?? 'asc').toLowerCase();

    if (!Object.hasOwn(Book.SORT_FIELDS, sort)) {
        return res.status(400).json({
            error: `Invalid sort field. Use one of: ${Object.keys(Book.SORT_FIELDS).join(', ')}`
        });
    }

    if (order !== 'asc' && order !== 'desc') {
        return res.status(400).json({
            error: "Invalid order. Use 'asc' or 'desc'"
        });
    }

    const filters = { sort, order };

    if (req.query.genre !== undefined) {
        const genre = req.query.genre.trim();

        if (genre === '') {
            return res.status(400).json({
                error: "Parameter 'genre' cannot be empty"
            });
        }

        filters.genre = genre;
    }

    if (req.query.author_id !== undefined) {
        const authorId = req.query.author_id.trim();

        if (!/^\d+$/.test(authorId) || Number(authorId) > MAX_INTEGER) {
            return res.status(400).json({
                error: "Parameter 'author_id' must be a positive integer"
            });
        }

        filters.authorId = Number(authorId);
    }

    if (req.query.author !== undefined) {
        const author = req.query.author.trim();

        if (author === '') {
            return res.status(400).json({
                error: "Parameter 'author' cannot be empty"
            });
        }

        filters.author = author;
    }

    try {
        const books = await Book.search(filters);

        res.json(books);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Server error'
        });
    }
}

export async function getByIsbn(req, res) {
    const { isbn } = req.params;

    try {
        const book = await Book.findByIsbn(isbn);

        if (!book) {
            return res.status(404).json({
                error: 'Book not found'
            });
        }

        res.json(book);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Server error'
        });
    }
}