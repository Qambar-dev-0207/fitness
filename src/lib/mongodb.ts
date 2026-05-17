import { MongoClient } from 'mongodb';

// --- MOCK DB IMPLEMENTATION FOR SIMULATION MODE ---
class MockCollection {
  name: string;
  data: any[];

  constructor(name: string) {
    this.name = name;
    // Persist in global for dev hot-reloads
    const globalStore = (global as any)._mockData || {};
    if (!globalStore[name]) globalStore[name] = [];
    this.data = globalStore[name] as any[];
    (global as any)._mockData = globalStore;
  }

  async insertOne(doc: any) {
    const newDoc = { ...doc, _id: Math.random().toString(36).substring(7) };
    this.data.push(newDoc);
    return { insertedId: newDoc._id };
  }

  async findOne(query: any) {
    return this.data.find(item => Object.keys(query).every(key => item[key] === query[key])) || null;
  }

  find(query: any = {}) {
    let results = this.data.filter(item => Object.keys(query).every(key => item[key] === query[key]));
    return {
      sort: (sortQuery: any) => {
        const key = Object.keys(sortQuery)[0];
        const dir = sortQuery[key];
        results.sort((a: any, b: any) => dir === -1 ? (b[key] > a[key] ? 1 : -1) : (a[key] > b[key] ? 1 : -1));
        return {
          limit: (n: number) => ({
            toArray: async () => results.slice(0, n),
            next: async () => results[0] || null
          }),
          toArray: async () => results,
          next: async () => results[0] || null
        };
      },
      limit: (n: number) => ({
        toArray: async () => results.slice(0, n),
        next: async () => results[0] || null
      }),
      toArray: async () => results,
      next: async () => results[0] || null
    };
  }

  async countDocuments(query: any = {}) {
    return this.data.filter(item => Object.keys(query).every(key => item[key] === query[key])).length;
  }
}

class MockDb {
  collection(name: string) {
    return new MockCollection(name);
  }
}

class MockClient {
  db() {
    return new MockDb();
  }
  async connect() {
    return this;
  }
  async close() {}
}

const uri = process.env.MONGODB_URI;
const isPlaceholder = !uri || uri.includes('<username>') || uri.includes('your_api_key');
const options = {};

let clientPromise: Promise<any>;

if (isPlaceholder) {
  console.warn("MONGODB_WARNING: Using Mock Database (Simulation Mode). Register/Login will work but data is in-memory.");
  const mockClient = new MockClient();
  clientPromise = Promise.resolve(mockClient);
} else {
  if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri!, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    const client = new MongoClient(uri!, options);
    clientPromise = client.connect();
  }
}

export default clientPromise;
