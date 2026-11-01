import express from 'express';
import * as userController from '../controllers/user.controller.js';

const router = express.Router();

router.post('/', userController.createUser);
router.get('/:username', userController.getByUsername);
router.patch('/:username', userController.updateUser);
router.put('/:username', userController.updateUser);

export default router;
