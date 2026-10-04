import express from 'express';
import * as bookController from '../controllers/book.controller.js';

const router = express.Router();

router.get('/:isbn', bookController.getByIsbn);

export default router;