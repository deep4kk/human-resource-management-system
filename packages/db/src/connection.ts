import mongoose from "mongoose";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.DATABASE_URL!);
  console.log("Connected to MongoDB");
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

export default mongoose;
