import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

export const Post = {
  async findAll({ search, category }) {
    const db = getDB();
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

    return db.collection('posts').find(query).sort({ createdAt: -1 }).toArray();
  },

  async findById(id) {
    const db = getDB();
    return db.collection('posts').findOne({ _id: new ObjectId(id) });
  },

  async findByAuthorId(authorId) {
    const db = getDB();
    return db.collection('posts').find({ authorId: new ObjectId(authorId) }).sort({ createdAt: -1 }).toArray();
  },

  async create(postData) {
    const db = getDB();
    const postToInsert = {
      title: postData.title,
      content: postData.content,
      category: postData.category,
      authorId: new ObjectId(postData.authorId),
      authorName: postData.authorName,
      likes: [],
      likesCount: 0,
      comments: [],
      commentsCount: 0,
      createdAt: new Date()
    };
    const result = await db.collection('posts').insertOne(postToInsert);
    return { ...postToInsert, _id: result.insertedId };
  },

  async update(id, postData) {
    const db = getDB();
    await db.collection('posts').updateOne(
      { _id: new ObjectId(id) },
      { $set: postData }
    );
    return this.findById(id);
  },

  async delete(id) {
    const db = getDB();
    return db.collection('posts').deleteOne({ _id: new ObjectId(id) });
  },

  async toggleLike(postId, userId) {
    const db = getDB();
    const postObjectId = new ObjectId(postId);
    const post = await db.collection('posts').findOne({ _id: postObjectId });
    if (!post) throw new Error('Post não encontrado.');

    const hasLiked = post.likes && post.likes.some(uId => uId.toString() === userId);

    if (hasLiked) {
      await db.collection('posts').updateOne(
        { _id: postObjectId },
        {
          $pull: { likes: new ObjectId(userId) },
          $inc: { likesCount: -1 }
        }
      );
      return { liked: false, likesCount: post.likesCount - 1 };
    } else {
      await db.collection('posts').updateOne(
        { _id: postObjectId },
        {
          $addToSet: { likes: new ObjectId(userId) },
          $inc: { likesCount: 1 }
        }
      );
      return { liked: true, likesCount: post.likesCount + 1 };
    }
  },

  async addComment(postId, commentData) {
    const db = getDB();
    const postObjectId = new ObjectId(postId);
    const newComment = {
      _id: new ObjectId(),
      content: commentData.content,
      authorId: new ObjectId(commentData.authorId),
      authorName: commentData.authorName,
      createdAt: new Date()
    };

    await db.collection('posts').updateOne(
      { _id: postObjectId },
      { $push: { comments: newComment }, $inc: { commentsCount: 1 } }
    );

    return newComment;
  },

  async deleteComment(postId, commentId) {
    const db = getDB();
    return db.collection('posts').updateOne(
      { _id: new ObjectId(postId) },
      {
        $pull: { comments: { _id: new ObjectId(commentId) } },
        $inc: { commentsCount: -1 }
      }
    );
  }
};
