const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all books by author ID
router.get('/:authorId/books', async (req, res) => {
    const { authorId } = req.params;

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
            WHERE authors.author_id = $1`,
            [authorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'No books found for this author'
            });
        }

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Server error'
        });
    }
});

module.exports = router;