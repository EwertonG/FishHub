import express from 'express';
import { fishController } from '../controllers/fishController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', fishController.getAllFishes);
router.get('/:id', fishController.getFishDetails);
router.post('/', authMiddleware, fishController.createFish);
router.put('/:id', authMiddleware, fishController.updateFish);
router.delete('/:id', authMiddleware, fishController.deleteFish);
router.post('/:id/favorite', authMiddleware, fishController.toggleFavorite);

export default router;
