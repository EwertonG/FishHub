import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

export const Aquarium = {
  async findAllByUserId(userId) {
    const db = getDB();
    return db.collection('aquariums').find({ userId: new ObjectId(userId) }).toArray();
  },

  async findById(id) {
    const db = getDB();
    return db.collection('aquariums').findOne({ _id: new ObjectId(id) });
  },

  async create(aquariumData) {
    const db = getDB();
    const aquariumToInsert = {
      userId: new ObjectId(aquariumData.userId),
      name: aquariumData.name,
      imageUrl: aquariumData.imageUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=60',
      type: aquariumData.type,
      volume: parseFloat(aquariumData.volume),
      dimensions: aquariumData.dimensions || '',
      setupDate: aquariumData.setupDate ? new Date(aquariumData.setupDate) : new Date(),
      substrate: aquariumData.substrate || '',
      notes: aquariumData.notes || '',
      inhabitants: [],
      equipment: [],
      parameters: [],
      maintenances: [],
      feedings: [],
      gallery: [],
      createdAt: new Date()
    };
    const result = await db.collection('aquariums').insertOne(aquariumToInsert);
    return { ...aquariumToInsert, _id: result.insertedId };
  },

  async update(id, aquariumData) {
    const db = getDB();
    const updateData = {
      name: aquariumData.name,
      imageUrl: aquariumData.imageUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=60',
      type: aquariumData.type,
      volume: parseFloat(aquariumData.volume),
      dimensions: aquariumData.dimensions || '',
      setupDate: aquariumData.setupDate ? new Date(aquariumData.setupDate) : new Date(),
      substrate: aquariumData.substrate || '',
      notes: aquariumData.notes || ''
    };
    await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return this.findById(id);
  },

  async delete(id) {
    const db = getDB();
    return db.collection('aquariums').deleteOne({ _id: new ObjectId(id) });
  },

  async addInhabitant(id, inhabitantData) {
    const db = getDB();
    const newInhabitant = {
      _id: new ObjectId(),
      type: inhabitantData.type,
      speciesId: inhabitantData.speciesId && ObjectId.isValid(inhabitantData.speciesId) ? new ObjectId(inhabitantData.speciesId) : null,
      speciesName: inhabitantData.speciesName,
      quantity: parseInt(inhabitantData.quantity) || 1,
      acquisitionDate: inhabitantData.acquisitionDate ? new Date(inhabitantData.acquisitionDate) : new Date(),
      notes: inhabitantData.notes || ''
    };
    await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id) },
      { $push: { inhabitants: newInhabitant } }
    );
    return newInhabitant;
  },

  async deleteInhabitant(id, inhabitantId) {
    const db = getDB();
    return db.collection('aquariums').updateOne(
      { _id: new ObjectId(id) },
      { $pull: { inhabitants: { _id: new ObjectId(inhabitantId) } } }
    );
  },

  async addEquipment(id, equipmentData) {
    const db = getDB();
    const newEquipment = {
      _id: new ObjectId(),
      name: equipmentData.name,
      type: equipmentData.type,
      specs: equipmentData.specs || '',
      notes: equipmentData.notes || ''
    };
    await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id) },
      { $push: { equipment: newEquipment } }
    );
    return newEquipment;
  },

  async deleteEquipment(id, equipmentId) {
    const db = getDB();
    return db.collection('aquariums').updateOne(
      { _id: new ObjectId(id) },
      { $pull: { equipment: { _id: new ObjectId(equipmentId) } } }
    );
  },

  async addParameters(id, paramData) {
    const db = getDB();
    const newMeasurement = {
      _id: new ObjectId(),
      date: new Date(paramData.date),
      temperature: parseFloat(paramData.temperature) || null,
      ph: parseFloat(paramData.ph) || null,
      ammonia: parseFloat(paramData.ammonia) || null,
      nitrite: parseFloat(paramData.nitrite) || null,
      nitrate: parseFloat(paramData.nitrate) || null,
      gh: parseFloat(paramData.gh) || null,
      kh: parseFloat(paramData.kh) || null,
      notes: paramData.notes || ''
    };
    await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id) },
      { $push: { parameters: { $each: [newMeasurement], $sort: { date: -1 } } } }
    );
    return newMeasurement;
  },

  async deleteParameters(id, parameterId) {
    const db = getDB();
    return db.collection('aquariums').updateOne(
      { _id: new ObjectId(id) },
      { $pull: { parameters: { _id: new ObjectId(parameterId) } } }
    );
  },

  async addMaintenance(id, maintenanceData) {
    const db = getDB();
    const newMaintenance = {
      _id: new ObjectId(),
      date: new Date(maintenanceData.date),
      type: maintenanceData.type,
      description: maintenanceData.description,
      imageUrl: maintenanceData.imageUrl || ''
    };
    await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id) },
      { $push: { maintenances: { $each: [newMaintenance], $sort: { date: -1 } } } }
    );
    return newMaintenance;
  },

  async deleteMaintenance(id, maintenanceId) {
    const db = getDB();
    return db.collection('aquariums').updateOne(
      { _id: new ObjectId(id) },
      { $pull: { maintenances: { _id: new ObjectId(maintenanceId) } } }
    );
  },

  async addFeeding(id, feedingData) {
    const db = getDB();
    const newFeeding = {
      _id: new ObjectId(),
      date: new Date(feedingData.date),
      time: feedingData.time || '',
      foodType: feedingData.foodType,
      quantity: parseFloat(feedingData.quantity) || null,
      notes: feedingData.notes || ''
    };
    await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id) },
      { $push: { feedings: { $each: [newFeeding], $sort: { date: -1 } } } }
    );
    return newFeeding;
  },

  async deleteFeeding(id, feedingId) {
    const db = getDB();
    return db.collection('aquariums').updateOne(
      { _id: new ObjectId(id) },
      { $pull: { feedings: { _id: new ObjectId(feedingId) } } }
    );
  },

  async addGalleryPhoto(id, galleryData) {
    const db = getDB();
    const newPhoto = {
      _id: new ObjectId(),
      imageUrl: galleryData.imageUrl,
      caption: galleryData.caption || '',
      date: galleryData.date ? new Date(galleryData.date) : new Date()
    };
    await db.collection('aquariums').updateOne(
      { _id: new ObjectId(id) },
      { $push: { gallery: { $each: [newPhoto], $sort: { date: -1 } } } }
    );
    return newPhoto;
  },

  async deleteGalleryPhoto(id, photoId) {
    const db = getDB();
    return db.collection('aquariums').updateOne(
      { _id: new ObjectId(id) },
      { $pull: { gallery: { _id: new ObjectId(photoId) } } }
    );
  }
};
