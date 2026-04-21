import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Ensure `.env` is loaded regardless of cwd.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const Connect = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      "MONGO_URI is missing. Ensure Backend/.env contains MONGO_URI or set it in environment variables."
    );
  }

  await mongoose.connect(uri, { dbName: "Dashboard" });
  console.log("DB Connected Successfully");
};

export default Connect;