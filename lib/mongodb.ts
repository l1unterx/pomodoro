import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable");
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoIndexesEnsured: Promise<void> | undefined;
}

function createClient(): Promise<MongoClient> {
  const client = new MongoClient(uri as string);
  return client.connect();
}

// Reuse the connection across hot reloads in dev and across invocations in
// prod. Created lazily (on first getDb() call) rather than at module import
// time, so merely importing this file (e.g. during the Next.js build's page
// data collection) never opens a database connection.
function getClientPromise(): Promise<MongoClient> {
  return global._mongoClientPromise ?? (global._mongoClientPromise = createClient());
}

async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db
      .collection("users")
      .createIndex({ username: 1 }, { unique: true, collation: { locale: "en", strength: 2 } }),
    db.collection("authSessions").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("authSessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("pomodoroSessions").createIndex({ userId: 1, startTime: -1 }),
    db.collection("pomodoroSessions").createIndex({ userId: 1, endTime: 1 }),
    db.collection("activeTimers").createIndex({ userId: 1 }, { unique: true }),
  ]);
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db();

  global._mongoIndexesEnsured =
    global._mongoIndexesEnsured ?? ensureIndexes(db);
  await global._mongoIndexesEnsured;

  return db;
}
