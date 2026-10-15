import * as Author from '../models/author.model.js';

export async function getBooks(req, res) {
    const { authorId } = req.params;

    try {
        const books = await Author.findBooks(authorId);

        if (books.length === 0) {
            return res.status(404).json({
                error: 'No books found for this author'
            });
        }

        res.json(books);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Server error'
        });
    }
}
export async function create(req, res) {
    const {
        first_name,
        last_name,
        biography,
        publisher
    } = req.body;

    if (!first_name || !last_name) {
        return res.status(400).json({
            error: 'first_name and last_name are required'
        });
    }

    if (
        typeof first_name !== 'string' ||
        typeof last_name !== 'string'
    ) {
        return res.status(400).json({
            error: 'first_name and last_name must be strings'
        });
    }

    if (
        first_name.trim() === '' ||
        last_name.trim() === ''
    ) {
        return res.status(400).json({
            error: 'first_name and last_name cannot be empty'
        });
    }

    try {
        const author = await Author.create({
            firstName: first_name.trim(),
            lastName: last_name.trim(),
            biography: biography ?? null,
            publisher: publisher ?? null
        });

        res.status(201).json(author);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Server error'
        });
    }
}