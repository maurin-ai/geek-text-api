import * as Wishlist from '../models/wishlist.model.js';

const MAX_INTEGER = 2147483647;

export async function getBooks(req, res) {
    const { wishlistId } = req.params;

    if (!/^\d+$/.test(wishlistId) || Number(wishlistId) > MAX_INTEGER) {
        return res.status(400).json({
            error: 'wishlistId must be a positive integer'
        });
    }

    try {
        if (!await Wishlist.exists(wishlistId)) {
            return res.status(404).json({
                error: 'Wishlist not found'
            });
        }

        const books = await Wishlist.findBooks(wishlistId);

        res.json(books);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Failed to retrieve wishlist books'
        });
    }
}