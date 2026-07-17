import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

export const User = {
  async findById(id, projection = {}) {
    const db = getDB();
    return db.collection('users').findOne({ _id: new ObjectId(id) }, { projection });
  },

  async findByEmail(email) {
    const db = getDB();
    return db.collection('users').findOne({ email: email.toLowerCase() });
  },

  async create(userData) {
    const db = getDB();
    const userToInsert = {
      ...userData,
      email: userData.email.toLowerCase(),
      favorites: userData.favorites || [],
      createdAt: new Date()
    };
    const result = await db.collection('users').insertOne(userToInsert);
    return { ...userToInsert, id: result.insertedId.toString() };
  },

  async updateProfile(id, updateData) {
    const db = getDB();
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return this.findById(id, { password: 0 });
  }
};
