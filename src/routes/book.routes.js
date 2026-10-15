import express from 'express';
import * as bookController from '../controllers/book.controller.js';

const router = express.Router();

router.post('/', bookController.create);
router.get('/', bookController.search);
router.get('/:isbn', bookController.getByIsbn);

export default router;