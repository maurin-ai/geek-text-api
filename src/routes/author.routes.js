import express from 'express';
import * as authorController from '../controllers/author.controller.js';

const router = express.Router();

router.post('/', authorController.create);
router.get('/', authorController.list);
router.get('/:authorId', authorController.getById);
router.patch('/:authorId', authorController.update);
router.delete('/:authorId', authorController.remove);
router.get('/:authorId/books', authorController.getBooks);

export default router;