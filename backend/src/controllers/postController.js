import { ObjectId } from 'mongodb';
import { Post } from '../models/Post.js';

export const postController = {
  async getAllPosts(req, res) {
    const { search, category } = req.query;
    try {
      const posts = await Post.findAll({ search, category });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao carregar posts.', error: error.message });
    }
  },

  async getPostDetails(req, res) {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de post inválido.' });
    }

    try {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ message: 'Discussão não encontrada.' });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao carregar discussão.', error: error.message });
    }
  },

  async createPost(req, res) {
    const { title, content, category } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Título, conteúdo e categoria são obrigatórios.' });
    }

    try {
      const newPost = await Post.create({
        title,
        content,
        category,
        authorId: req.user.id,
        authorName: req.user.name
      });
      res.status(201).json(newPost);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao criar discussão.', error: error.message });
    }
  },

  async updatePost(req, res) {
    const { id } = req.params;
    const { title, content, category } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de post inválido.' });
    }

    try {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ message: 'Discussão não encontrada.' });
      }

      const isAdmin = req.user.email === 'admin@admin.com' || req.user.id === '6a583ed9a838f74b25344fcc';
      if (post.authorId.toString() !== req.user.id && !isAdmin) {
        return res.status(403).json({ message: 'Você não tem permissão para editar esta discussão.' });
      }

      const updatedPost = await Post.update(id, {
        title: title || post.title,
        content: content || post.content,
        category: category || post.category
      });

      res.json(updatedPost);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao editar discussão.', error: error.message });
    }
  },

  async deletePost(req, res) {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de post inválido.' });
    }

    try {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ message: 'Discussão não encontrada.' });
      }

      const isAdmin = req.user.email === 'admin@admin.com' || req.user.id === '6a583ed9a838f74b25344fcc';
      if (post.authorId.toString() !== req.user.id && !isAdmin) {
        return res.status(403).json({ message: 'Você não tem permissão para excluir esta discussão.' });
      }

      await Post.delete(id);
      res.json({ message: 'Discussão excluída com sucesso.' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao excluir discussão.', error: error.message });
    }
  },

  async toggleLike(req, res) {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de post inválido.' });
    }

    try {
      const result = await Post.toggleLike(id, req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao curtir post.', error: error.message });
    }
  },

  async addComment(req, res) {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Conteúdo do comentário é obrigatório.' });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de post inválido.' });
    }

    try {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ message: 'Discussão não encontrada.' });
      }

      const newComment = await Post.addComment(id, {
        content,
        authorId: req.user.id,
        authorName: req.user.name
      });

      res.status(201).json(newComment);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao adicionar comentário.', error: error.message });
    }
  },

  async deleteComment(req, res) {
    const { id, commentId } = req.params;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: 'IDs inválidos.' });
    }

    try {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ message: 'Discussão não encontrada.' });
      }

      const comment = post.comments && post.comments.find(c => c._id.toString() === commentId);
      if (!comment) {
        return res.status(404).json({ message: 'Comentário não encontrado.' });
      }

      const isAdmin = req.user.email === 'admin@admin.com' || req.user.id === '6a583ed9a838f74b25344fcc';
      const isCommentAuthor = comment.authorId && comment.authorId.toString() === req.user.id;
      const isPostAuthor = post.authorId && post.authorId.toString() === req.user.id;

      if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
        return res.status(403).json({ message: 'Sem permissão para remover este comentário.' });
      }

      await Post.deleteComment(id, commentId);
      res.json({ message: 'Comentário removido com sucesso.' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao remover comentário.', error: error.message });
    }
  }
};
