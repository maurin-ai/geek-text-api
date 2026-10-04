import express from 'express';
import * as userController from '../controllers/user.controller.js';

const router = express.Router();

router.get('/:username', userController.getByUsername);

export default router;