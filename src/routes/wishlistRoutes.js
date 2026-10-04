const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/:wishlistId/books', async (req, res) => {
    try {
        const { wishlistId } = req.params;

        const result = await pool.query(
            `SELECT
                b.book_id,
                b.isbn,
                b.name,
                b.description,
                b.price,
                b.author_id,
                b.genre,
                b.publisher,
                b.year_published,
                b.copies_sold
             FROM wishlist_books wb
             JOIN books b
                ON wb.book_id = b.book_id
             WHERE wb.wishlist_id = $1
             ORDER BY b.book_id`,
            [wishlistId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Failed to retrieve wishlist books'
        });
    }
});

module.exports = router;

