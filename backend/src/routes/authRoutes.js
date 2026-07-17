import express from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authMiddleware, authController.getMe);
router.put('/auth/profile', authMiddleware, authController.updateProfile);
router.get('/users/:id/stats', authController.getUserStats);

export default router;
