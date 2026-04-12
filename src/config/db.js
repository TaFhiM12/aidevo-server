import { MongoClient, ServerApiVersion } from "mongodb";
import env from "./env.js";

const uri = `mongodb+srv://${env.dbUser}:${env.dbPassword}@cluster0.sexese6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let dbInstance = null;

export async function connectDB() {
  if (dbInstance) {
    return dbInstance;
  }

  await client.connect();
  dbInstance = client.db(env.dbName);
  console.log("✅ Connected to MongoDB successfully!");

  return dbInstance;
}

export function getDB() {
  if (!dbInstance) {
    throw new Error("Database is not connected yet. Call connectDB() first.");
  }

  return dbInstance;
}

export { client };