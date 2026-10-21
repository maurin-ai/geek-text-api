import express from 'express';
import * as userController from '../controllers/user.controller.js';

const router = express.Router();

router.post('/', userController.createUser);
router.get('/:username', userController.getByUsername);

export default router;
