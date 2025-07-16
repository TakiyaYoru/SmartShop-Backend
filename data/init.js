import mongoose from "mongoose";

export async function initDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;
  await mongoose.connect(DATABASE_URL);
  console.log(`SmartShop Database is up and running at: ${DATABASE_URL}`);
}