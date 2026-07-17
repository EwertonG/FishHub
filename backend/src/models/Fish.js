import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

export const Fish = {
  async findAll({ search, category, temperament, minPh, maxPh, minTemp, maxTemp, sortBy }) {
    const db = getDB();
    const query = {};

    if (search) {
      query.$or = [
        { commonName: { $regex: search, $options: 'i' } },
        { scientificName: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (temperament) {
      query.temperament = temperament;
    }

    if (minPh || maxPh) {
      query.$and = query.$and || [];
      if (minPh) {
        query.$and.push({ phMax: { $gte: parseFloat(minPh) } });
      }
      if (maxPh) {
        query.$and.push({ phMin: { $lte: parseFloat(maxPh) } });
      }
    }

    if (minTemp || maxTemp) {
      query.$and = query.$and || [];
      if (minTemp) {
        query.$and.push({ tempMax: { $gte: parseFloat(minTemp) } });
      }
      if (maxTemp) {
        query.$and.push({ tempMin: { $lte: parseFloat(maxTemp) } });
      }
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === 'views') {
      sortOptions = { views: -1, createdAt: -1 };
    } else if (sortBy === 'name') {
      sortOptions = { commonName: 1 };
    }

    return db.collection('fishes').find(query).sort(sortOptions).toArray();
  },

  async findById(id) {
    const db = getDB();
    return db.collection('fishes').findOne({ _id: new ObjectId(id) });
  },

  async findByIdAndIncrementViews(id) {
    const db = getDB();
    return db.collection('fishes').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    );
  },

  async create(fishData) {
    const db = getDB();
    const fishToInsert = {
      ...fishData,
      createdBy: new ObjectId(fishData.createdBy),
      views: 0,
      createdAt: new Date()
    };
    const result = await db.collection('fishes').insertOne(fishToInsert);
    return { ...fishToInsert, _id: result.insertedId };
  },

  async update(id, fishData) {
    const db = getDB();
    const updateData = { ...fishData };
    
    if (updateData.createdBy) {
      updateData.createdBy = new ObjectId(updateData.createdBy);
    }
    
    await db.collection('fishes').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return this.findById(id);
  },

  async delete(id) {
    const db = getDB();
    const fishObjectId = new ObjectId(id);
    
    const result = await db.collection('fishes').deleteOne({ _id: fishObjectId });
    
    await db.collection('users').updateMany(
      { favorites: fishObjectId },
      { $pull: { favorites: fishObjectId } }
    );
    
    return result;
  },

  async toggleFavorite(fishId, userId) {
    const db = getDB();
    const fishObjectId = new ObjectId(fishId);
    const userObjectId = new ObjectId(userId);

    const user = await db.collection('users').findOne({ _id: userObjectId });
    if (!user) throw new Error('Usuário não encontrado.');

    const isFavorited = user.favorites && user.favorites.some(favId => favId.toString() === fishId);

    if (isFavorited) {
      await db.collection('users').updateOne(
        { _id: userObjectId },
        { $pull: { favorites: fishObjectId } }
      );
      return { isFavorited: false, message: 'Removido dos favoritos.' };
    } else {
      await db.collection('users').updateOne(
        { _id: userObjectId },
        { $addToSet: { favorites: fishObjectId } }
      );
      return { isFavorited: true, message: 'Adicionado aos favoritos.' };
    }
  },

  async findManyByIds(ids) {
    const db = getDB();
    const objectIds = ids.map(id => new ObjectId(id));
    return db.collection('fishes').find({ _id: { $in: objectIds } }).toArray();
  }
};
