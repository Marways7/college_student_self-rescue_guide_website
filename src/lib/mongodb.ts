import { MongoClient } from "mongodb";

let uri = process.env.DATABASE_URL as string | undefined;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const globalWithMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

async function connectWithFallback(): Promise<MongoClient> {
  if (uri) {
    try {
      const c = new MongoClient(uri);
      await c.connect();
      return c;
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("MongoDB connection failed, falling back to in-memory server for development.");
      } else {
        throw e;
      }
    }
  }

  // Fallback: in-memory MongoDB for development
  if (process.env.NODE_ENV !== "production") {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    const c = new MongoClient(uri);
    await c.connect();
    return c;
  }

  throw new Error("DATABASE_URL is not set");
}

if (process.env.NODE_ENV === "development") {
  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = connectWithFallback();
  }
  clientPromise = globalWithMongo._mongoClientPromise!;
} else {
  clientPromise = connectWithFallback();
}

export default clientPromise;
