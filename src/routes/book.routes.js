import express from 'express';
import * as bookController from '../controllers/book.controller.js';

const router = express.Router();

router.post('/', bookController.create);
router.get('/', bookController.search);
router.get('/genres', bookController.getGenres);
router.get('/:isbn', bookController.getByIsbn);
router.patch('/:isbn', bookController.update);
router.delete('/:isbn', bookController.remove);

export default router;