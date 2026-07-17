import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'fishhub';

let client = null;
let db = null;

export async function connectDB() {
  if (db) return db;
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log(`Successfully connected to MongoDB database: ${dbName}`);
    
    // Create initial indexes for search performance and uniqueness
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('fishes').createIndex({ commonName: 'text', scientificName: 'text', category: 'text' });
    await db.collection('posts').createIndex({ title: 'text', content: 'text' });
    await db.collection('aquariums').createIndex({ userId: 1 });
    
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}
