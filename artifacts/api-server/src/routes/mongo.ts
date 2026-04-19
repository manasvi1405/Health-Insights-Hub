import mongoose from "mongoose";
import { logger } from "../lib/logger";

let connected = false;

export async function connectMongo() {
  if (connected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 15000,
    tls: true,
    tlsAllowInvalidCertificates: false,
  });
  connected = true;
  logger.info("MongoDB connected");
}

export async function connectMongoLazy() {
  try {
    await connectMongo();
  } catch (err) {
    logger.error(err, "MongoDB connection failed");
    throw err;
  }
}

const userSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true, required: true },
  age: Number,
  language: { type: String, default: "English" },
  bloodGroup: String,
  address: String,
  otp: String,
  otpExpiry: Date,
  profileComplete: { type: Boolean, default: false },
}, { timestamps: true });

const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  medName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, enum: ["once", "twice", "thrice"], required: true },
  times: [String],
  stockCount: { type: Number, default: 30 },
  autoReminder: { type: Boolean, default: true },
}, { timestamps: true });

const scanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["medicine", "prescription", "report"], required: true },
  imageBase64: String,
  aiInsight: { type: String, required: true },
  summary: String,
}, { timestamps: true });

const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relation: String,
  isPrimary: { type: Boolean, default: false },
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
export const ReminderModel = mongoose.models.Reminder || mongoose.model("Reminder", reminderSchema);
export const ScanModel = mongoose.models.Scan || mongoose.model("Scan", scanSchema);
export const ContactModel = mongoose.models.Contact || mongoose.model("Contact", contactSchema);
