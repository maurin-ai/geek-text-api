import * as Book from '../models/book.model.js';

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