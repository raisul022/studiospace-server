import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
export const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;
  try {
    await client.connect();
    const dbName = process.env.DB_NAME || 'studiospace_db';
    db = client.db(dbName);
    console.log(`[MongoDB] Connected successfully to database: ${dbName}`);
    return db;
  } catch (error) {
    console.warn('[MongoDB] Initial connection error (Check MONGODB_URI in .env):', error);
    throw error;
  }
}

export function getDB(): Db {
  if (!db) {
    const dbName = process.env.DB_NAME || 'studiospace_db';
    return client.db(dbName);
  }
  return db;
}
