import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Fish } from '../models/Fish.js';

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'admin123',
    { expiresIn: '7d' }
  );
};

export const authController = {
  async register(req, res) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
    }

    try {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Este email já está em uso.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        favorites: []
      });

      const token = generateToken(user.id);
      res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          favorites: user.favorites
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao registrar usuário.', error: error.message });
    }
  },

  async login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Preencha todos os campos.' });
    }

    try {
      const user = await User.findByEmail(email);
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
      res.status(500).json({ message: 'Erro ao fazer login.', error: error.message });
    }
  },

  async getMe(req, res) {
    try {
      const user = await User.findById(req.user.id, { password: 0 });
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }
      res.json({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        favorites: user.favorites || []
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao obter dados do usuário.', error: error.message });
    }
  },

  async updateProfile(req, res) {
    const { name, email, password } = req.body;
    const updateData = {};

    try {
      if (name) updateData.name = name;
      if (email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser._id.toString() !== req.user.id) {
          return res.status(400).json({ message: 'Este e-mail já está em uso por outro usuário.' });
        }
        updateData.email = email.toLowerCase();
      }

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'Nenhum dada fornecido para atualização.' });
      }

      const updatedUser = await User.updateProfile(req.user.id, updateData);
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
      res.status(500).json({ message: 'Erro ao atualizar perfil.', error: error.message });
    }
  },

  async getUserStats(req, res) {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID do usuário inválido.' });
    }

    try {
      const userPosts = await Post.findByAuthorId(id);
      const totalLikesReceived = userPosts.reduce((acc, post) => acc + (post.likesCount || 0), 0);

      const user = await User.findById(id, { password: 0 });
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      let favoriteFishes = [];
      if (user.favorites && user.favorites.length > 0) {
        favoriteFishes = await Fish.findManyByIds(user.favorites);
      }

      res.json({
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        },
        stats: {
          postsCount: userPosts.length,
          likesCount: totalLikesReceived
        },
        posts: userPosts.map(p => ({
          id: p._id.toString(),
          title: p.title,
          category: p.category,
          likesCount: p.likesCount,
          commentsCount: p.commentsCount,
          createdAt: p.createdAt
        })),
        favorites: favoriteFishes.map(f => ({
          id: f._id.toString(),
          commonName: f.commonName,
          scientificName: f.scientificName,
          imageUrl: f.imageUrl,
          category: f.category
        }))
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar estatísticas do usuário.', error: error.message });
    }
  }
};
