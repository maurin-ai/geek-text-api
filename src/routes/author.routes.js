import express from 'express';
import * as authorController from '../controllers/author.controller.js';

const router = express.Router();

router.get('/:authorId/books', authorController.getBooks);

export default router;