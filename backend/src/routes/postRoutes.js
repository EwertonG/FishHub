import express from 'express';
import { postController } from '../controllers/postController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostDetails);
router.post('/', authMiddleware, postController.createPost);
router.put('/:id', authMiddleware, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);
router.post('/:id/like', authMiddleware, postController.toggleLike);
router.post('/:id/comments', authMiddleware, postController.addComment);
router.delete('/:id/comments/:commentId', authMiddleware, postController.deleteComment);

export default router;
