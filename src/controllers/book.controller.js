import * as Book from '../models/book.model.js';
import {
    parseId, parseInteger, parsePrice, parsePatchBody,
    text, nonEmpty, nullable, number
} from '../utils/validate.js';

const ALLOWED_PARAMS = new Set([
    'sort', 'order', 'genre', 'author', 'author_id', 'q',
    'min_price', 'max_price', 'min_year', 'max_year', 'page', 'limit'
]);

const NUMERIC_FILTERS = [
    ['author_id', 'authorId', parseId, 'a positive integer'],
    ['min_price', 'minPrice', parsePrice, 'a price like 9.99'],
    ['max_price', 'maxPrice', parsePrice, 'a price like 9.99'],
    ['min_year', 'minYear', parseInteger, 'a whole number'],
    ['max_year', 'maxYear', parseInteger, 'a whole number']
];

const BOOK_PATCH_FIELDS = {
    name: { key: 'name', parse: nonEmpty(text(255)) },
    description: { key: 'description', parse: nullable(text()) },
    price: { key: 'price', parse: number(0, 99999999) },
    author_id: { key: 'authorId', parse: number(1, 2147483647, { integer: true }) },
    genre: { key: 'genre', parse: nullable(text(100)) },
    publisher: { key: 'publisher', parse: nullable(text(255)) },
    year_published: { key: 'yearPublished', parse: nullable(number(1, 9999, { integer: true })) },
    copies_sold: { key: 'copiesSold', parse: number(0, 2147483647, { integer: true }) }
};

export async function search(req, res) {
    const unknown = Object.keys(req.query).filter(key => !ALLOWED_PARAMS.has(key));

    if (unknown.length > 0) {
        return res.status(400).json({
            error: `Unknown parameter(s): ${unknown.join(', ')}. Allowed: ${[...ALLOWED_PARAMS].join(', ')}`
        });
    }

    for (const [key, value] of Object.entries(req.query)) {
        if (typeof value !== 'string') {
            return res.status(400).json({ error: `Parameter '${key}' must be a single value` });
        }
    }

    const sort = (req.query.sort ?? 'title').trim().toLowerCase();
    const order = (req.query.order ?? 'asc').trim().toLowerCase();

    if (!Object.hasOwn(Book.SORT_FIELDS, sort)) {
        return res.status(400).json({
            error: `Invalid sort field. Use one of: ${Object.keys(Book.SORT_FIELDS).join(', ')}`
        });
    }

    if (order !== 'asc' && order !== 'desc') {
        return res.status(400).json({ error: "Invalid order. Use 'asc' or 'desc'" });
    }

    const filters = {};

    for (const param of ['genre', 'author', 'q']) {
        if (req.query[param] === undefined) continue;
        const value = req.query[param].trim();
        if (value === '') {
            return res.status(400).json({ error: `Parameter '${param}' cannot be empty` });
        }
        filters[param] = value;
    }

    for (const [param, key, parse, hint] of NUMERIC_FILTERS) {
        if (req.query[param] === undefined) continue;
        const value = parse(req.query[param].trim());
        if (value === null) {
            return res.status(400).json({ error: `Parameter '${param}' must be ${hint}` });
        }
        filters[key] = value;
    }

    if (filters.minPrice > filters.maxPrice) {
        return res.status(400).json({ error: "'min_price' cannot be greater than 'max_price'" });
    }
    if (filters.minYear > filters.maxYear) {
        return res.status(400).json({ error: "'min_year' cannot be greater than 'max_year'" });
    }

    // Pagination is opt in so existing clients still get the full list
    let paging = {};
    if (req.query.page !== undefined || req.query.limit !== undefined) {
        const page = req.query.page === undefined ? 1 : parseId(req.query.page.trim());
        const limit = req.query.limit === undefined ? 20 : parseId(req.query.limit.trim());

        if (page === null) {
            return res.status(400).json({ error: "'page' must be a positive integer" });
        }
        if (limit === null || limit > 100) {
            return res.status(400).json({ error: "'limit' must be an integer from 1 to 100" });
        }
        paging = { limit, offset: (page - 1) * limit };
    }

    try {
        const books = await Book.search({ ...filters, sort, order, ...paging });

        if (paging.limit !== undefined) {
            res.set('X-Total-Count', String(await Book.count(filters)));
        }

        res.json(books);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
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

export async function update(req, res) {
    const { isbn } = req.params;

    if (!/^\d{13}$/.test(isbn)) {
        return res.status(400).json({ error: 'isbn must contain exactly 13 digits' });
    }

    const { error, values } = parsePatchBody(req.body, BOOK_PATCH_FIELDS);
    if (error) return res.status(400).json({ error });

    try {
        const book = await Book.update(isbn, values);

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json(book);

    } catch (err) {
        console.error(err);

        if (err.code === '23503') {
            return res.status(400).json({ error: 'author_id does not reference an existing author' });
        }

        res.status(500).json({ error: 'Server error' });
    }
}

export async function remove(req, res) {
    const { isbn } = req.params;

    if (!/^\d{13}$/.test(isbn)) {
        return res.status(400).json({ error: 'isbn must contain exactly 13 digits' });
    }

    try {
        const book = await Book.remove(isbn);

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.status(204).send();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function getGenres(req, res) {
    try {
        res.json(await Book.listGenres());
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}