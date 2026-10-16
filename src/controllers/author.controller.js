import * as Author from '../models/author.model.js';
import { parseId, parsePatchBody, text, nonEmpty, nullable } from '../utils/validate.js';

const AUTHOR_PATCH_FIELDS = {
    first_name: { key: 'firstName', parse: nonEmpty(text(100)) },
    last_name: { key: 'lastName', parse: nonEmpty(text(100)) },
    biography: { key: 'biography', parse: nullable(text()) },
    publisher: { key: 'publisher', parse: nullable(text(255)) }
};

const invalidId = (res) =>
    res.status(400).json({ error: 'authorId must be a positive integer' });

export async function list(req, res) {
    try {
        res.json(await Author.findAll());
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function getById(req, res) {
    const authorId = parseId(req.params.authorId);
    if (authorId === null) return invalidId(res);

    try {
        const author = await Author.findById(authorId);

        if (!author) {
            return res.status(404).json({ error: 'Author not found' });
        }

        res.json(author);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function getBooks(req, res) {
    const authorId = parseId(req.params.authorId);
    if (authorId === null) return invalidId(res);

    try {
        if (!(await Author.findById(authorId))) {
            return res.status(404).json({ error: 'Author not found' });
        }

        res.json(await Author.findBooks(authorId));

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
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

export async function update(req, res) {
    const authorId = parseId(req.params.authorId);
    if (authorId === null) return invalidId(res);

    const { error, values } = parsePatchBody(req.body, AUTHOR_PATCH_FIELDS);
    if (error) return res.status(400).json({ error });

    try {
        const author = await Author.update(authorId, values);

        if (!author) {
            return res.status(404).json({ error: 'Author not found' });
        }

        res.json(author);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function remove(req, res) {
    const authorId = parseId(req.params.authorId);
    if (authorId === null) return invalidId(res);

    try {
        const author = await Author.remove(authorId);

        if (!author) {
            return res.status(404).json({ error: 'Author not found' });
        }

        res.status(204).send();

    } catch (error) {
        console.error(error);

        // books.author_id has no ON DELETE rule so an author with books can't be deleted
        if (error.code === '23503') {
            return res.status(409).json({
                error: 'Author still has books. Delete or reassign them first.'
            });
        }

        res.status(500).json({ error: 'Server error' });
    }
}