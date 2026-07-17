import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Por favor, envie um arquivo de imagem.' });
    }
    const imageUrl = `/api/uploads/${req.file.filename}`;
    res.status(201).json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao fazer upload da imagem.', error: error.message });
  }
});

router.use((error, req, res, next) => {
  res.status(400).json({ message: error.message });
});

export default router;
