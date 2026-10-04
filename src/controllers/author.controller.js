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