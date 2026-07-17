import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { connectDB, getDB } from './src/config/db.js';
import { authMiddleware } from './src/middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploads folder static files under /api/uploads
app.use('/api/uploads', express.static(uploadDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'fish-' + uniqueSuffix + ext);
  }
});

// File filter (accept images only)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // limit 5MB
});

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// Helper function to sign JWT tokens
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'supersecret_fishhub_key_12345',
    { expiresIn: '7d' }
  );
};

// ==========================================
// AUTH ROUTES
// ==========================================

// Register User
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    const db = getDB();
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Este email já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection('users').insertOne({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      favorites: [],
      createdAt: new Date()
    });

    const token = generateToken(result.insertedId.toString());
    res.status(201).json({
      token,
      user: {
        id: result.insertedId.toString(),
        name,
        email: email.toLowerCase(),
        favorites: []
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao criar conta.' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Preencha todos os campos.' });
  }

  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    const token = generateToken(user._id.toString());
    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        favorites: user.favorites || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao realizar login.' });
  }
});

// Get User Profile
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.id) });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      favorites: user.favorites || [],
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar dados do perfil.' });
  }
});

// Update Profile
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  const { name, email, password } = req.body;
  const db = getDB();

  try {
    const updateData = {};
    if (name) updateData.name = name;
    if (email) {
      const emailLower = email.toLowerCase();
      // Check email uniqueness
      const existingUser = await db.collection('users').findOne({
        email: emailLower,
        _id: { $ne: new ObjectId(req.user.id) }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Este email já está sendo usado por outro usuário.' });
      }
      updateData.email = emailLower;
    }
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Nenhum dado informado para atualização.' });
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: updateData }
    );

    // Get updated user data
    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(req.user.id) });
    res.json({
      message: 'Perfil atualizado com sucesso.',
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        favorites: updatedUser.favorites || []
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Erro interno ao atualizar perfil.' });
  }
});

// ==========================================
// FILE UPLOAD ROUTES
// ==========================================

// Upload Image Route (Protected, only authenticated users can upload)
app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }
    const fileUrl = `/api/uploads/${req.file.filename}`;
    res.status(201).json({ imageUrl: fileUrl });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Erro ao fazer upload da imagem.' });
  }
}, (error, req, res, next) => {
  res.status(400).json({ message: error.message });
});

// ==========================================
// FISH CATALOGUE ROUTES
// ==========================================

// Get all fishes (with search, filter, and sorting)
app.get('/api/fishes', async (req, res) => {
  const { search, category, temperament, minPh, maxPh, minTemp, maxTemp, sortBy } = req.query;
  const db = getDB();

  try {
    const query = {};

    // Dynamic Real-time search
    if (search) {
      query.$or = [
        { commonName: { $regex: search, $options: 'i' } },
        { scientificName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Direct Category Filter
    if (category) {
      query.category = category;
    }

    // Temperament Filter
    if (temperament) {
      query.temperament = temperament;
    }

    // pH Filter (Checks if range overlaps or standard bounds)
    if (minPh || maxPh) {
      query.$and = query.$and || [];
      if (minPh) {
        // pH max of fish must be >= query's minPh
        query.$and.push({ phMax: { $gte: parseFloat(minPh) } });
      }
      if (maxPh) {
        // pH min of fish must be <= query's maxPh
        query.$and.push({ phMin: { $lte: parseFloat(maxPh) } });
      }
    }

    // Temperature Filter
    if (minTemp || maxTemp) {
      query.$and = query.$and || [];
      if (minTemp) {
        query.$and.push({ tempMax: { $gte: parseFloat(minTemp) } });
      }
      if (maxTemp) {
        query.$and.push({ tempMin: { $lte: parseFloat(maxTemp) } });
      }
    }

    // Set sorting options
    let sortOptions = { createdAt: -1 }; // default newest
    if (sortBy === 'views') {
      sortOptions = { views: -1, createdAt: -1 };
    } else if (sortBy === 'name') {
      sortOptions = { commonName: 1 };
    }

    const fishes = await db.collection('fishes').find(query).sort(sortOptions).toArray();
    res.json(fishes);
  } catch (error) {
    console.error('Get fishes error:', error);
    res.status(500).json({ message: 'Erro ao buscar catálogo de peixes.' });
  }
});

// Get fish details (Increments views count)
app.get('/api/fishes/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDB();

  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de peixe inválido.' });
    }

    // Increment views atomically and return the updated document
    const result = await db.collection('fishes').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ message: 'Peixe não encontrado.' });
    }

    res.json(result);
  } catch (error) {
    console.error('Get fish details error:', error);
    res.status(500).json({ message: 'Erro ao carregar detalhes do peixe.' });
  }
});

// Create Fish
app.post('/api/fishes', authMiddleware, async (req, res) => {
  const {
    commonName,
    scientificName,
    category,
    description,
    temperament,
    diet,
    averageSize,
    lifespan,
    phMin,
    phMax,
    tempMin,
    tempMax,
    compatibility,
    imageUrl
  } = req.body;

  if (!commonName || !scientificName || !category || !description) {
    return res.status(400).json({ message: 'Nome, nome científico, categoria e descrição são obrigatórios.' });
  }

  try {
    const db = getDB();
    const newFish = {
      commonName,
      scientificName,
      category,
      description,
      temperament: temperament || 'Pacífico',
      diet: diet || 'Onívoro',
      averageSize: averageSize ? parseFloat(averageSize) : 0,
      lifespan: lifespan ? parseFloat(lifespan) : 0,
      phMin: phMin ? parseFloat(phPhFormat(phMin)) : 6.0,
      phMax: phMax ? parseFloat(phPhFormat(phMax)) : 8.0,
      tempMin: tempMin ? parseFloat(tempMin) : 20,
      tempMax: tempMax ? parseFloat(tempMax) : 28,
      compatibility: Array.isArray(compatibility) ? compatibility : (compatibility ? compatibility.split(',').map(s => s.trim()) : []),
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      createdBy: new ObjectId(req.user.id),
      views: 0,
      createdAt: new Date()
    };

    const result = await db.collection('fishes').insertOne(newFish);
    res.status(201).json({ id: result.insertedId, ...newFish });
  } catch (error) {
    console.error('Create fish error:', error);
    res.status(500).json({ message: 'Erro ao registrar nova espécie.' });
  }
});

// Helper for formatting ph
function phPhFormat(val) {
  return String(val).replace(',', '.');
}

// Update Fish
app.put('/api/fishes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const db = getDB();

  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const fish = await db.collection('fishes').findOne({ _id: new ObjectId(id) });
    if (!fish) {
      return res.status(404).json({ message: 'Espécie não encontrada.' });
    }

    // Permission check: only creator or admin can edit
    const isAdmin = req.user.email === 'admin@admin.com' || req.user.id === '6a583ed9a838f74b25344fcc';
    if (fish.createdBy.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ message: 'Você não tem permissão para editar esta espécie.' });
    }

    const {
      commonName,
      scientificName,
      category,
      description,
      temperament,
      diet,
      averageSize,
      lifespan,
      phMin,
      phMax,
      tempMin,
      tempMax,
      compatibility,
      imageUrl
    } = req.body;

    const updateFields = {
      commonName,
      scientificName,
      category,
      description,
      temperament: temperament || 'Pacífico',
      diet: diet || 'Onívoro',
      averageSize: averageSize ? parseFloat(averageSize) : 0,
      lifespan: lifespan ? parseFloat(lifespan) : 0,
      phMin: phMin ? parseFloat(phPhFormat(phMin)) : 6.0,
      phMax: phMax ? parseFloat(phPhFormat(phMax)) : 8.0,
      tempMin: tempMin ? parseFloat(tempMin) : 20,
      tempMax: tempMax ? parseFloat(tempMax) : 28,
      compatibility: Array.isArray(compatibility) ? compatibility : (compatibility ? compatibility.split(',').map(s => s.trim()) : []),
      imageUrl: imageUrl || fish.imageUrl
    };

    await db.collection('fishes').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    res.json({ message: 'Espécie atualizada com sucesso.' });
  } catch (error) {
    console.error('Update fish error:', error);
    res.status(500).json({ message: 'Erro ao editar dados da espécie.' });
  }
});

// Delete Fish
app.delete('/api/fishes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const db = getDB();

  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const fish = await db.collection('fishes').findOne({ _id: new ObjectId(id) });
    if (!fish) {
      return res.status(404).json({ message: 'Espécie não encontrada.' });
    }

    // Permission check: only creator or admin can delete
    const isAdmin = req.user.email === 'admin@admin.com' || req.user.id === '6a583ed9a838f74b25344fcc';
    if (fish.createdBy.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ message: 'Apenas o criador ou administradores podem excluir este registro.' });
    }

    await db.collection('fishes').deleteOne({ _id: new ObjectId(id) });
    
    // Also remove from user favorites arrays
    await db.collection('users').updateMany(
      { favorites: new ObjectId(id) },
      { $pull: { favorites: new ObjectId(id) } }
    );

    res.json({ message: 'Espécie excluída com sucesso.' });
  } catch (error) {
    console.error('Delete fish error:', error);
    res.status(500).json({ message: 'Erro ao excluir espécie.' });
  }
});

// Favorite / Unfavorite Fish
app.post('/api/fishes/:id/favorite', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const db = getDB();

  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de peixe inválido.' });
    }

    const fishObjectId = new ObjectId(id);
    const userObjectId = new ObjectId(req.user.id);

    const user = await db.collection('users').findOne({ _id: userObjectId });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const isFavorited = user.favorites && user.favorites.some(favId => favId.toString() === id);

    if (isFavorited) {
      // Remove favorite
      await db.collection('users').updateOne(
        { _id: userObjectId },
        { $pull: { favorites: fishObjectId } }
      );
      res.json({ isFavorited: false, message: 'Removido dos favoritos.' });
    } else {
      // Add favorite
      await db.collection('users').updateOne(
        { _id: userObjectId },
        { $addToSet: { favorites: fishObjectId } }
      );
      res.json({ isFavorited: true, message: 'Adicionado aos favoritos!' });
    }
  } catch (error) {
    console.error('Favorite error:', error);
    res.status(500).json({ message: 'Erro ao favoritar espécie.' });
  }
});


// ==========================================
// FORUM / DISCUSSION ROUTES
// ==========================================

// Get all posts (with search and category filtering)
app.get('/api/posts', async (req, res) => {
  const { search, category } = req.query;
  const db = getDB();

  try {
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const posts = await db.collection('posts').find(query).sort({ createdAt: -1 }).toArray();
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Erro ao buscar publicações do fórum.' });
  }
});

// Get post details
app.get('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDB();

  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
    if (!post) {
      return res.status(404).json({ message: 'Publicação não encontrada.' });
    }

    res.json(post);
  } catch (error) {
    console.error('Get post detail error:', error);
    res.status(500).json({ message: 'Erro ao obter detalhes da publicação.' });
  }
});

// Create Post
app.post('/api/posts', authMiddleware, async (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !content || !category) {
    return res.status(400).json({ message: 'Título, conteúdo e categoria são obrigatórios.' });
  }

  try {
    const db = getDB();
    const newPost = {
      title,
      content,
      category,
      authorId: new ObjectId(req.user.id),
      authorName: req.user.name,
      likes: [],
      likesCount: 0,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('posts').insertOne(newPost);
    res.status(201).json({ id: result.insertedId, ...newPost });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Erro ao criar publicação.' });
  }
});

// Update Post
app.put('/api/posts/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, content, category } = req.body;
  const db = getDB();

  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
    if (!post) {
      return res.status(404).json({ message: 'Publicação não encontrada.' });
    }

    const isAdmin = req.user.email === 'admin@admin.com' || req.user.id === '6a583ed9a838f74b25344fcc';
    if (post.authorId.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ message: 'Permissão negada. Apenas o autor ou administradores podem editar este post.' });
    }

    const updateFields = {
      updatedAt: new Date()
    };
    if (title) updateFields.title = title;
    if (content) updateFields.content = content;
    if (category) updateFields.category = category;

    await db.collection('posts').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    res.json({ message: 'Publicação atualizada com sucesso.' });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Erro ao editar publicação.' });
  }
});

// Delete Post
app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const db = getDB();

  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
    if (!post) {
      return res.status(404).json({ message: 'Publicação não encontrada.' });
    }

    const isAdmin = req.user.email === 'admin@admin.com' || req.user.id === '6a583ed9a838f74b25344fcc';
    if (post.authorId.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ message: 'Permissão negada. Apenas o autor ou administradores podem excluir este post.' });
    }

    await db.collection('posts').deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Publicação excluída com sucesso.' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Erro ao excluir publicação.' });
  }
});

// Like / Unlike Post
app.post('/api/posts/:id/like', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const db = getDB();

  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const userObjectId = new ObjectId(req.user.id);
    const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
    if (!post) {
      return res.status(404).json({ message: 'Publicação não encontrada.' });
    }

    const hasLiked = post.likes && post.likes.some(uId => uId.toString() === req.user.id);

    if (hasLiked) {
      // Unlike post
      await db.collection('posts').updateOne(
        { _id: new ObjectId(id) },
        {
          $pull: { likes: userObjectId },
          $inc: { likesCount: -1 }
        }
      );
      res.json({ liked: false, likesCount: post.likesCount - 1 });
    } else {
      // Like post
      await db.collection('posts').updateOne(
        { _id: new ObjectId(id) },
        {
          $addToSet: { likes: userObjectId },
          $inc: { likesCount: 1 }
        }
      );
      res.json({ liked: true, likesCount: post.likesCount + 1 });
    }
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: 'Erro ao processar curtida.' });
  }
});

// Add Comment
app.post('/api/posts/:id/comments', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ message: 'O conteúdo do comentário não pode estar vazio.' });
  }

  try {
    const db = getDB();
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de publicação inválido.' });
    }

    const comment = {
      _id: new ObjectId(),
      authorId: new ObjectId(req.user.id),
      authorName: req.user.name,
      content,
      createdAt: new Date()
    };

    const updateResult = await db.collection('posts').updateOne(
      { _id: new ObjectId(id) },
      { $push: { comments: comment } }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'Publicação não encontrada.' });
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Erro ao adicionar comentário.' });
  }
});

// Delete Comment
app.delete('/api/posts/:id/comments/:commentId', authMiddleware, async (req, res) => {
  const { id, commentId } = req.params;
  const db = getDB();

  console.log('[DEBUG DELETE COMMENT] Request params:', { id, commentId });
  console.log('[DEBUG DELETE COMMENT] User:', req.user);

  try {
    if (!ObjectId.isValid(id)) {
      console.log('[DEBUG DELETE COMMENT] Invalid post ID');
      return res.status(400).json({ message: 'ID de publicação inválido.' });
    }

    const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
    if (!post) {
      console.log('[DEBUG DELETE COMMENT] Post not found');
      return res.status(404).json({ message: 'Publicação não encontrada.' });
    }

    console.log('[DEBUG DELETE COMMENT] Post authorId:', post.authorId);
    console.log('[DEBUG DELETE COMMENT] Post comments:', post.comments);

    const comment = post.comments.find(c => c._id && c._id.toString() === commentId);
    if (!comment) {
      console.log('[DEBUG DELETE COMMENT] Comment not found in post.comments list');
      return res.status(404).json({ message: 'Comentário não encontrado.' });
    }

    console.log('[DEBUG DELETE COMMENT] Comment authorId:', comment.authorId);

    // Permission: Only comment author OR post author OR admin can delete
    const isAdmin = req.user.email === 'admin@admin.com' || req.user.id === '6a583ed9a838f74b25344fcc';
    
    const commentAuthorIdStr = comment.authorId ? comment.authorId.toString() : '';
    const postAuthorIdStr = post.authorId ? post.authorId.toString() : '';

    console.log('[DEBUG DELETE COMMENT] Authorization checks:', {
      commentAuthorIdStr,
      postAuthorIdStr,
      reqUserId: req.user.id,
      isAdmin
    });

    if (commentAuthorIdStr !== req.user.id && postAuthorIdStr !== req.user.id && !isAdmin) {
      console.log('[DEBUG DELETE COMMENT] Permission denied');
      return res.status(403).json({ message: 'Permissão negada para excluir este comentário.' });
    }

    const pullTarget = ObjectId.isValid(commentId)
      ? { _id: { $in: [commentId, new ObjectId(commentId)] } }
      : { _id: commentId };

    console.log('[DEBUG DELETE COMMENT] pullTarget:', pullTarget);

    const updateResult = await db.collection('posts').updateOne(
      { _id: new ObjectId(id) },
      { $pull: { comments: pullTarget } }
    );

    console.log('[DEBUG DELETE COMMENT] updateResult:', {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount
    });

    res.json({ message: 'Comentário excluído com sucesso.' });
  } catch (error) {
    console.error('[DEBUG DELETE COMMENT] Error caught:', error);
    res.status(500).json({ message: 'Erro ao excluir comentário.' });
  }
});

// Get user profile details & statistics (posts created + total likes received)
app.get('/api/users/:id/stats', async (req, res) => {
  const { id } = req.params;
  const db = getDB();

  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID do usuário inválido.' });
    }

    // 1. Get user posts
    const userPosts = await db.collection('posts').find({ authorId: new ObjectId(id) }).sort({ createdAt: -1 }).toArray();

    // 2. Sum likes received across all user's posts
    const totalLikesReceived = userPosts.reduce((acc, post) => acc + (post.likesCount || 0), 0);

    // 3. Get user details
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // 4. Fetch the fish list that user favorited
    let favoriteFishes = [];
    if (user.favorites && user.favorites.length > 0) {
      favoriteFishes = await db.collection('fishes').find({ _id: { $in: user.favorites } }).toArray();
    }

    res.json({
      user,
      posts: userPosts,
      totalLikesReceived,
      favorites: favoriteFishes
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas do usuário.' });
  }
});

// ==========================================
// AQUARIUMS MODULE ROUTES (Protected by authMiddleware)
// ==========================================

// Get all aquariums of logged-in user
app.get('/api/aquariums', authMiddleware, async (req, res) => {
  const db = getDB();
  try {
    const aquariums = await db.collection('aquariums')
      .find({ userId: new ObjectId(req.user.id) })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(aquariums);
  } catch (error) {
    console.error('Get aquariums error:', error);
    res.status(500).json({ message: 'Erro ao carregar lista de aquários.' });
  }
});

// Get aquarium details
app.get('/api/aquariums/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const db = getDB();
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de aquário inválido.' });
    }
    const aquarium = await db.collection('aquariums').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(req.user.id)
    });
    if (!aquarium) {
      return res.status(404).json({ message: 'Aquário não encontrado.' });
    }
    res.json(aquarium);
  } catch (error) {
    console.error('Get aquarium details error:', error);
    res.status(500).json({ message: 'Erro ao carregar detalhes do aquário.' });
  }
});

// Create Aquarium
app.post('/api/aquariums', authMiddleware, async (req, res) => {
  const { name, imageUrl, type, volume, dimensions, setupDate, substrate, notes } = req.body;
  if (!name || !type || !volume) {
    return res.status(400).json({ message: 'Nome, tipo e litragem são obrigatórios.' });
  }

  const db = getDB();
  try {
    const newAquarium = {
      userId: new ObjectId(req.user.id),
      name,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=60',
      type, // Água Doce / Marinho
      volume: parseFloat(volume),
      dimensions: dimensions || '',
      setupDate: setupDate ? new Date(setupDate) : new Date(),
      substrate: substrate || '',
      notes: notes || '',
      inhabitants: [],
      equipment: [],
      parameters: [],
      maintenances: [],
      feedings: [],
      gallery: [],
      createdAt: new Date()
    };

    const result = await db.collection('aquariums').insertOne(newAquarium);
    res.status(201).json({ id: result.insertedId, ...newAquarium });
  } catch (error) {
    console.error('Create aquarium error:', error);
    res.status(500).json({ message: 'Erro ao cadastrar aquário.' });
  }
});

// Update Aquarium basic info
app.put('/api/aquariums/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, imageUrl, type, volume, dimensions, setupDate, substrate, notes } = req.body;
  
  if (!name || !type || !volume) {
    return res.status(400).json({ message: 'Nome, tipo e litragem são obrigatórios.' });
  }

  const db = getDB();
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const updateFields = {
      name,
      type,
      volume: parseFloat(volume),
      dimensions: dimensions || '',
      setupDate: setupDate ? new Date(setupDate) : new Date(),
      substrate: substrate || '',
      notes: notes || ''
    };
    if (imageUrl) {
      updateFields.imageUrl = imageUrl;
    }

    const result = await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Aquário não encontrado ou sem permissão.' });
    }

    res.json({ message: 'Aquário atualizado com sucesso.' });
  } catch (error) {
    console.error('Update aquarium error:', error);
    res.status(500).json({ message: 'Erro ao editar aquário.' });
  }
});

// Delete Aquarium
app.delete('/api/aquariums/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const db = getDB();
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const result = await db.collection('aquariums').deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(req.user.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Aquário não encontrado ou sem permissão.' });
    }

    res.json({ message: 'Aquário excluído com sucesso.' });
  } catch (error) {
    console.error('Delete aquarium error:', error);
    res.status(500).json({ message: 'Erro ao excluir aquário.' });
  }
});

// --- SUB-RESOURCES ---

// Add Inhabitant
app.post('/api/aquariums/:id/inhabitants', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { type, speciesId, speciesName, quantity, acquisitionDate, notes } = req.body;

  if (!type || !speciesName || !quantity) {
    return res.status(400).json({ message: 'Tipo, nome/espécie e quantidade são obrigatórios.' });
  }

  const db = getDB();
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de aquário inválido.' });
    }

    const newInhabitant = {
      _id: new ObjectId(),
      type, // Peixe, Planta, Camarão, Caramujo
      speciesId: speciesId && ObjectId.isValid(speciesId) ? new ObjectId(speciesId) : null,
      speciesName,
      quantity: parseInt(quantity) || 1,
      acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : new Date(),
      notes: notes || ''
    };

    const result = await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.id) },
      { $push: { inhabitants: newInhabitant } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Aquário não encontrado.' });
    }

    res.status(201).json(newInhabitant);
  } catch (error) {
    console.error('Add inhabitant error:', error);
    res.status(500).json({ message: 'Erro ao adicionar habitante.' });
  }
});

// Delete Inhabitant
app.delete('/api/aquariums/:id/inhabitants/:inhabitantId', authMiddleware, async (req, res) => {
  const { id, inhabitantId } = req.params;
  const db = getDB();
  try {
    if (!ObjectId.isValid(id) || !ObjectId.isValid(inhabitantId)) {
      return res.status(400).json({ message: 'IDs inválidos.' });
    }

    const result = await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.id) },
      { $pull: { inhabitants: { _id: new ObjectId(inhabitantId) } } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Aquário não encontrado ou sem permissão.' });
    }

    res.json({ message: 'Habitante removido com sucesso.' });
  } catch (error) {
    console.error('Delete inhabitant error:', error);
    res.status(500).json({ message: 'Erro ao remover habitante.' });
  }
});

// Add Equipment
app.post('/api/aquariums/:id/equipment', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, type, specs, notes } = req.body;

  if (!name || !type) {
    return res.status(400).json({ message: 'Nome e tipo de equipamento são obrigatórios.' });
  }

  const db = getDB();
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const newEquipment = {
      _id: new ObjectId(),
      name,
      type, // Filtro, Aquecedor, Iluminação, CO2, etc.
      specs: specs || '',
      notes: notes || ''
    };

    const result = await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.id) },
      { $push: { equipment: newEquipment } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Aquário não encontrado.' });
    }

    res.status(201).json(newEquipment);
  } catch (error) {
    console.error('Add equipment error:', error);
    res.status(500).json({ message: 'Erro ao adicionar equipamento.' });
  }
});

// Delete Equipment
app.delete('/api/aquariums/:id/equipment/:equipmentId', authMiddleware, async (req, res) => {
  const { id, equipmentId } = req.params;
  const db = getDB();
  try {
    if (!ObjectId.isValid(id) || !ObjectId.isValid(equipmentId)) {
      return res.status(400).json({ message: 'IDs inválidos.' });
    }

    const result = await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.id) },
      { $pull: { equipment: { _id: new ObjectId(equipmentId) } } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Aquário não encontrado ou sem permissão.' });
    }

    res.json({ message: 'Equipamento removido com sucesso.' });
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({ message: 'Erro ao remover equipamento.' });
  }
});

// Add Parameters Measurement
app.post('/api/aquariums/:id/parameters', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { date, temperature, ph, ammonia, nitrite, nitrate, gh, kh, notes } = req.body;

  if (!date) {
    return res.status(400).json({ message: 'A data da medição é obrigatória.' });
  }

  const db = getDB();
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const newParameters = {
      _id: new ObjectId(),
      date: new Date(date),
      temperature: temperature ? parseFloat(temperature) : null,
      ph: ph ? parseFloat(ph) : null,
      ammonia: ammonia ? parseFloat(ammonia) : null,
      nitrite: nitrite ? parseFloat(nitrite) : null,
      nitrate: nitrate ? parseFloat(nitrate) : null,
      gh: gh ? parseFloat(gh) : null,
      kh: kh ? parseFloat(kh) : null,
      notes: notes || ''
    };

    const result = await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.id) },
      { $push: { parameters: newParameters } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Aquário não encontrado.' });
    }

    res.status(201).json(newParameters);
  } catch (error) {
    console.error('Add parameters error:', error);
    res.status(500).json({ message: 'Erro ao registrar parâmetros da água.' });
  }
});

// Delete Parameters Measurement
app.delete('/api/aquariums/:id/parameters/:parameterId', authMiddleware, async (req, res) => {
  const { id, parameterId } = req.params;
  const db = getDB();
  try {
    if (!ObjectId.isValid(id) || !ObjectId.isValid(parameterId)) {
      return res.status(400).json({ message: 'IDs inválidos.' });
    }

    const result = await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.id) },
      { $pull: { parameters: { _id: new ObjectId(parameterId) } } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Aquário não encontrado ou sem permissão.' });
    }

    res.json({ message: 'Medição excluída com sucesso.' });
  } catch (error) {
    console.error('Delete parameters error:', error);
    res.status(500).json({ message: 'Erro ao excluir medição.' });
  }
});

// Add Maintenance
app.post('/api/aquariums/:id/maintenances', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { date, type, description, imageUrl } = req.body;

  if (!date || !type || !description) {
    return res.status(400).json({ message: 'Data, tipo e descrição são obrigatórios.' });
  }

  const db = getDB();
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const newMaintenance = {
      _id: new ObjectId(),
      date: new Date(date),
      type, // TPA, Limpeza de filtro, Troca de mídias, Sifonagem, Poda, Outras
      description,
      imageUrl: imageUrl || ''
    };

    const result = await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.id) },
      { $push: { maintenances: newMaintenance } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Aquário não encontrado.' });
    }

    res.status(201).json(newMaintenance);
  } catch (error) {
    console.error('Add maintenance error:', error);
    res.status(500).json({ message: 'Erro ao adicionar registro de manutenção.' });
  }
});

// Delete Maintenance
app.delete('/api/aquariums/:id/maintenances/:maintenanceId', authMiddleware, async (req, res) => {
  const { id, maintenanceId } = req.params;
  const db = getDB();
  try {
    if (!ObjectId.isValid(id) || !ObjectId.isValid(maintenanceId)) {
      return res.status(400).json({ message: 'IDs inválidos.' });
    }

    const result = await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.id) },
      { $pull: { maintenances: { _id: new ObjectId(maintenanceId) } } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Aquário não encontrado ou sem permissão.' });
    }

    res.json({ message: 'Registro de manutenção excluído com sucesso.' });
  } catch (error) {
    console.error('Delete maintenance error:', error);
    res.status(500).json({ message: 'Erro ao excluir manutenção.' });
  }
});

// Add Feeding
app.post('/api/aquariums/:id/feedings', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { date, time, foodType, quantity, notes } = req.body;

  if (!date || !time || !foodType) {
    return res.status(400).json({ message: 'Data, horário e tipo de alimento são obrigatórios.' });
  }

  const db = getDB();
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const newFeeding = {
      _id: new ObjectId(),
      date: new Date(date),
      time,
      foodType,
      quantity: quantity || '',
      notes: notes || ''
    };

    const result = await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.id) },
      { $push: { feedings: newFeeding } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Aquário não encontrado.' });
    }

    res.status(201).json(newFeeding);
  } catch (error) {
    console.error('Add feeding error:', error);
    res.status(500).json({ message: 'Erro ao registrar alimentação.' });
  }
});

// Delete Feeding
app.delete('/api/aquariums/:id/feedings/:feedingId', authMiddleware, async (req, res) => {
  const { id, feedingId } = req.params;
  const db = getDB();
  try {
    if (!ObjectId.isValid(id) || !ObjectId.isValid(feedingId)) {
      return res.status(400).json({ message: 'IDs inválidos.' });
    }

    const result = await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.id) },
      { $pull: { feedings: { _id: new ObjectId(feedingId) } } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Aquário não encontrado ou sem permissão.' });
    }

    res.json({ message: 'Registro de alimentação excluído com sucesso.' });
  } catch (error) {
    console.error('Delete feeding error:', error);
    res.status(500).json({ message: 'Erro ao excluir alimentação.' });
  }
});

// Add Photo to Gallery
app.post('/api/aquariums/:id/gallery', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { imageUrl, caption, date } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ message: 'A URL da imagem é obrigatória.' });
  }

  const db = getDB();
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const newPhoto = {
      _id: new ObjectId(),
      imageUrl,
      caption: caption || '',
      date: date ? new Date(date) : new Date()
    };

    const result = await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.id) },
      { $push: { gallery: newPhoto } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Aquário não encontrado.' });
    }

    res.status(201).json(newPhoto);
  } catch (error) {
    console.error('Add photo to gallery error:', error);
    res.status(500).json({ message: 'Erro ao adicionar foto à galeria.' });
  }
});

// Delete Photo from Gallery
app.delete('/api/aquariums/:id/gallery/:photoId', authMiddleware, async (req, res) => {
  const { id, photoId } = req.params;
  const db = getDB();
  try {
    if (!ObjectId.isValid(id) || !ObjectId.isValid(photoId)) {
      return res.status(400).json({ message: 'IDs inválidos.' });
    }

    const result = await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.id) },
      { $pull: { gallery: { _id: new ObjectId(photoId) } } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Aquário não encontrado ou sem permissão.' });
    }

    res.json({ message: 'Foto removida da galeria.' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ message: 'Erro ao excluir foto.' });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`FishHub Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1);
  }
}

startServer();
