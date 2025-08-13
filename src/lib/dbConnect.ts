import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("❌ Please define the MONGODB_URI in .env");
}

// 1️⃣ Create a cached object on the global object
// This ensures we reuse the same connection across hot reloads in dev
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

// 2️⃣ Function to connect to MongoDB
export async function dbConnect() {
  if (cached.conn) {
    // Already connected
    return cached.conn;
  }

  if (!cached.promise) {
    // If no connection promise exists, create one
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false, // disable mongoose buffering
    }).then((mongoose) => {
      return mongoose;
    });
  }

  // Await the connection promise
  cached.conn = await cached.promise;
  return cached.conn;
}

// 3️⃣ Export the connection function
export default dbConnect;