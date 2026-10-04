import express from 'express';
import * as wishlistController from '../controllers/wishlist.controller.js';

const router = express.Router();

router.get('/:wishlistId/books', wishlistController.getBooks);

export default router;