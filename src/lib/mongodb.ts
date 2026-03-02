import mongoose, { Mongoose } from "mongoose"

const URI = process.env.MONGODB_URI!

if (!URI) {
  throw new Error(
    "❌ Please define the MONGODB_URI environment variable inside .env.local"
  )
}

interface MongooseCache {
  conn: Mongoose | null
  promise: Promise<Mongoose> | null
}

// Définition globale pour éviter   la recréation de connexion en dev (hot reload)
declare global {
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null
}

export async function connectToDatabase(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(URI, {
        dbName: "strass-shop" // optionnel si déjà dans l’URI
      })
      .then((mongoose) => {
        return mongoose
      })
  }

  cached.conn = await cached.promise
  global.mongooseCache = cached

  return cached.conn
}
