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
export async function create(req, res) {
    const {
        isbn,
        name,
        description,
        price,
        author_id,
        genre,
        publisher,
        year_published,
        copies_sold
    } = req.body;

    if (!isbn || !name || price === undefined || !author_id) {
        return res.status(400).json({
            error: 'isbn, name, price, and author_id are required'
        });
    }

    if (
        typeof isbn !== 'string' ||
        typeof name !== 'string'
    ) {
        return res.status(400).json({
            error: 'isbn and name must be strings'
        });
    }

    if (!/^\d{13}$/.test(isbn)) {
        return res.status(400).json({
            error: 'isbn must contain exactly 13 digits'
        });
    }

    const numericPrice = Number(price);
    const numericAuthorId = Number(author_id);
    const numericYear = year_published !== undefined ? Number(year_published) : null;
    const numericCopies = copies_sold !== undefined ? Number(copies_sold) : 0;

    if (Number.isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
            error: 'price must be a non-negative number'
        });
    }

    if (!Number.isInteger(numericAuthorId) || numericAuthorId <= 0) {
        return res.status(400).json({
            error: 'author_id must be a positive integer'
        });
    }

    if (
        numericYear !== null &&
        (!Number.isInteger(numericYear) || numericYear <= 0)
    ) {
        return res.status(400).json({
            error: 'year_published must be a positive integer'
        });
    }

    if (!Number.isInteger(numericCopies) || numericCopies < 0) {
        return res.status(400).json({
            error: 'copies_sold must be a non-negative integer'
        });
    }

    try {
        const book = await Book.create({
            isbn: isbn.trim(),
            name: name.trim(),
            description: description ?? null,
            price: numericPrice,
            authorId: numericAuthorId,
            genre: genre ?? null,
            publisher: publisher ?? null,
            yearPublished: numericYear,
            copiesSold: numericCopies
        });

        res.status(201).json(book);

    } catch (error) {
        console.error(error);

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'A book with this ISBN already exists'
            });
        }

        if (error.code === '23503') {
            return res.status(400).json({
                error: 'author_id does not reference an existing author'
            });
        }

        res.status(500).json({
            error: 'Server error'
        });
    }
}