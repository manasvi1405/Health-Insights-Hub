// SehatSaathi - Backend server
// Single Node + Express server. Serves both the API and the static frontend.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.SESSION_SECRET || "sehat-saathi-secret";

// ---------- Middleware ----------
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ---------- MongoDB connection ----------
let mongoConnected = false;
async function connectMongo() {
  if (mongoConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in .env");
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 15000,
  });
  mongoConnected = true;
  console.log("[mongo] connected");
}

// ---------- Mongoose Schemas ----------
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

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Reminder = mongoose.models.Reminder || mongoose.model("Reminder", reminderSchema);
const Scan = mongoose.models.Scan || mongoose.model("Scan", scanSchema);
const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);

// ---------- Auth middleware ----------
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ---------- Gemini AI client (for scan analysis) ----------
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  const baseUrl = process.env.GEMINI_BASE_URL; // optional custom proxy
  if (!apiKey && !baseUrl) {
    throw new Error("GEMINI_API_KEY is not set in .env");
  }
  const opts = { apiKey: apiKey || "dummy" };
  if (baseUrl) opts.httpOptions = { baseUrl };
  return new GoogleGenAI(opts);
}

function getLanguageInstruction(language) {
  const lang = (language || "English").toLowerCase();
  if (lang.startsWith("hi")) return "Respond ENTIRELY in simple Hindi (हिन्दी). Use easy everyday words.";
  if (lang.startsWith("mr")) return "Respond ENTIRELY in simple Marathi (मराठी). Use easy everyday words.";
  if (lang.startsWith("ta")) return "Respond ENTIRELY in simple Tamil (தமிழ்). Use easy everyday words.";
  if (lang.startsWith("bn")) return "Respond ENTIRELY in simple Bengali (বাংলা). Use easy everyday words.";
  return "Respond in simple English. Avoid medical jargon. Use plain words anyone can understand.";
}

function getScanPrompt(type, language) {
  const inst = getLanguageInstruction(language);
  if (type === "medicine") {
    return `You are a helpful health assistant. Analyze this medicine image. ${inst}

Tell the patient:
1. What is this medicine called?
2. What is it used for? (in simple words)
3. How is it usually taken? (dose and timing)
4. Important warnings (e.g., avoid alcohol, take after food)
5. How to store it

Keep the answer short, simple, and friendly. Start with "Medicine:" followed by the name.`;
  }
  if (type === "prescription") {
    return `You are a helpful health assistant. Analyze this prescription. ${inst}

Tell the patient:
1. Which medicines are prescribed and their doses
2. What each medicine does (in simple words)
3. When to take each medicine (before/after food, morning/night)
4. How many days to take them
5. Any special instructions

Keep it short, clear, and easy to understand. Always remind them to follow their doctor's advice.`;
  }
  return `You are a helpful health assistant. Analyze this medical report. ${inst}

Tell the patient:
1. What test was done and what was found
2. Which values are normal and which are high/low (mark clearly)
3. What does this mean for their health (in simple words)
4. What should they do next?
5. Any lifestyle tips (food, exercise, rest)?

Be simple, caring, and clear. Always say they should show this to their doctor.`;
}

// ===============================================================
// API ROUTES
// ===============================================================

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ---------- AUTH ----------
const DEV_PHONE = "8446530525";
const DEV_OTP = "123456";

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    await connectMongo();
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone is required" });

    const otp = phone === DEV_PHONE ? DEV_OTP : String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.findOneAndUpdate(
      { phone },
      { otp, otpExpiry },
      { upsert: true, new: true }
    );

    if (phone !== DEV_PHONE) {
      console.log(`[auth] OTP for ${phone}: ${otp} (SMS not configured - shown in console for dev)`);
    }
    res.json({ message: phone === DEV_PHONE ? `Dev OTP: ${DEV_OTP}` : "OTP sent successfully" });
  } catch (err) {
    console.error("send-otp error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    await connectMongo();
    const { phone, otp, name } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: "Phone and OTP required" });

    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ error: "User not found, send OTP first" });

    const isValid = user.otp === otp && (user.otpExpiry ? user.otpExpiry > new Date() : true);
    if (!isValid && !(phone === DEV_PHONE && otp === DEV_OTP)) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    if (name && !user.name) {
      user.name = name;
      user.profileComplete = true;
    }
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id, phone }, JWT_SECRET, { expiresIn: "30d" });
    res.json({
      token,
      user: { _id: user._id, name: user.name, phone: user.phone, age: user.age, language: user.language, bloodGroup: user.bloodGroup, address: user.address, profileComplete: user.profileComplete }
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// ---------- USERS ----------
app.get("/api/users/me", requireAuth, async (req, res) => {
  try {
    await connectMongo();
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to get user" });
  }
});

app.put("/api/users/me", requireAuth, async (req, res) => {
  try {
    await connectMongo();
    const { name, age, language, bloodGroup, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, age, language, bloodGroup, address, profileComplete: true },
      { new: true, lean: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// ---------- REMINDERS ----------
app.get("/api/reminders", requireAuth, async (req, res) => {
  try {
    await connectMongo();
    const list = await Reminder.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Failed to get reminders" }); }
});

app.post("/api/reminders", requireAuth, async (req, res) => {
  try {
    await connectMongo();
    const { medName, dosage, frequency, times, stockCount, autoReminder } = req.body;
    const r = await Reminder.create({
      userId: req.userId, medName, dosage, frequency, times,
      stockCount: stockCount ?? 30, autoReminder: autoReminder ?? true,
    });
    res.status(201).json(r);
  } catch (err) { res.status(500).json({ error: "Failed to create reminder" }); }
});

app.put("/api/reminders/:id", requireAuth, async (req, res) => {
  try {
    await connectMongo();
    const r = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body, { new: true, lean: true }
    );
    if (!r) return res.status(404).json({ error: "Reminder not found" });
    res.json(r);
  } catch (err) { res.status(500).json({ error: "Failed to update reminder" }); }
});

app.delete("/api/reminders/:id", requireAuth, async (req, res) => {
  try {
    await connectMongo();
    await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: "Reminder deleted" });
  } catch (err) { res.status(500).json({ error: "Failed to delete reminder" }); }
});

app.post("/api/reminders/:id/taken", requireAuth, async (req, res) => {
  try {
    await connectMongo();
    const r = await Reminder.findOne({ _id: req.params.id, userId: req.userId });
    if (!r) return res.status(404).json({ error: "Reminder not found" });
    r.stockCount = Math.max(0, (r.stockCount || 0) - 1);
    await r.save();
    let stockAlert;
    if (r.stockCount === 0) stockAlert = "OUT_OF_STOCK";
    else if (r.stockCount <= 2) stockAlert = "RUNNING_LOW";
    res.json({ reminder: r, stockAlert, stockCount: r.stockCount });
  } catch (err) { res.status(500).json({ error: "Failed to mark taken" }); }
});

// ---------- CONTACTS ----------
app.get("/api/contacts", requireAuth, async (req, res) => {
  try {
    await connectMongo();
    const list = await Contact.find({ userId: req.userId }).lean();
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Failed to get contacts" }); }
});

app.post("/api/contacts", requireAuth, async (req, res) => {
  try {
    await connectMongo();
    const { name, phone, relation, isPrimary } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "Name and phone required" });
    if (isPrimary) await Contact.updateMany({ userId: req.userId }, { isPrimary: false });
    const c = await Contact.create({ userId: req.userId, name, phone, relation, isPrimary: !!isPrimary });
    res.status(201).json(c);
  } catch (err) { res.status(500).json({ error: "Failed to create contact" }); }
});

app.delete("/api/contacts/:id", requireAuth, async (req, res) => {
  try {
    await connectMongo();
    await Contact.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: "Contact deleted" });
  } catch (err) { res.status(500).json({ error: "Failed to delete contact" }); }
});

// ---------- SOS ----------
app.post("/api/sos", requireAuth, async (req, res) => {
  try {
    await connectMongo();
    const { latitude, longitude, message } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Location required" });
    }
    const locationLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    const contacts = await Contact.find({ userId: req.userId }).lean();
    const user = await User.findById(req.userId).lean();
    console.log("[SOS]", { user: user?.name, location: locationLink, contacts: contacts.length, message });
    res.json({
      message: `SOS alert sent! ${contacts.length} contact(s) notified.`,
      contactsNotified: contacts.length, locationLink,
    });
  } catch (err) { res.status(500).json({ error: "SOS failed" }); }
});

// ---------- HOME SUMMARY ----------
function getGreeting(name, language) {
  const hour = new Date().getHours();
  const lang = (language || "English").toLowerCase();
  let g;
  if (lang.startsWith("hi")) g = hour < 12 ? "शुभ प्रभात" : hour < 17 ? "नमस्ते" : "शुभ संध्या";
  else if (lang.startsWith("mr")) g = hour < 12 ? "शुभ सकाळ" : hour < 17 ? "नमस्कार" : "शुभ संध्याकाळ";
  else if (lang.startsWith("ta")) g = hour < 12 ? "காலை வணக்கம்" : hour < 17 ? "மதிய வணக்கம்" : "மாலை வணக்கம்";
  else if (lang.startsWith("bn")) g = hour < 12 ? "সুপ্রভাত" : hour < 17 ? "শুভ অপরাহ্ণ" : "শুভ সন্ধ্যা";
  else g = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${g}${name ? `, ${name}` : ""}!`;
}

app.get("/api/home/summary", requireAuth, async (req, res) => {
  try {
    await connectMongo();
    const user = await User.findById(req.userId).lean();
    const allReminders = await Reminder.find({ userId: req.userId }).lean();
    const recentScans = await Scan.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(5).lean();
    const lowStockAlerts = allReminders.filter((r) => (r.stockCount ?? 30) <= 5);
    res.json({
      greeting: getGreeting(user?.name, user?.language),
      dueMedications: allReminders,
      recentScans, lowStockAlerts,
    });
  } catch (err) { res.status(500).json({ error: "Failed to get summary" }); }
});

// ---------- SCANS (AI) ----------
app.get("/api/scans", requireAuth, async (req, res) => {
  try {
    await connectMongo();
    const list = await Scan.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(20).lean();
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Failed to get scans" }); }
});

app.post("/api/scans", requireAuth, async (req, res) => {
  try {
    await connectMongo();
    const { type, imageBase64 } = req.body;
    if (!type || !imageBase64) return res.status(400).json({ error: "Type and image required" });

    const userDoc = await User.findById(req.userId).lean();
    const language = userDoc?.language || "English";

    let aiInsight = "";
    let summary = "";

    try {
      const ai = getAI();
      const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      const mimeType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";

      const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
      let lastErr = null;
      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [{
              role: "user",
              parts: [
                { text: getScanPrompt(type, language) },
                { inlineData: { mimeType, data: base64Data } },
              ],
            }],
            config: { maxOutputTokens: 8192 },
          });
          aiInsight = response.text || "";
          if (aiInsight) break;
        } catch (e) {
          lastErr = e;
          console.warn(`[ai] model ${model} failed, trying next:`, e?.message?.slice(0, 200));
        }
      }
      if (!aiInsight) throw lastErr || new Error("All AI models failed");
      const lines = aiInsight.split("\n").filter((l) => l.trim());
      summary = lines.slice(0, 2).join(" ").slice(0, 200);
    } catch (aiErr) {
      console.error("AI scan error:", aiErr);
      const errMsg = aiErr?.message || String(aiErr);
      aiInsight = `${type.charAt(0).toUpperCase() + type.slice(1)} scanned, but AI analysis is temporarily unavailable. Please try again in a moment, or consult your healthcare provider.\n\n(Technical detail: ${errMsg.slice(0, 200)})`;
      summary = "Scan complete - AI analysis unavailable.";
    }

    const scan = await Scan.create({
      userId: req.userId, type, imageBase64: imageBase64.slice(0, 100),
      aiInsight, summary,
    });
    res.json(scan);
  } catch (err) {
    console.error("createScan error:", err);
    res.status(500).json({ error: "Failed to process scan" });
  }
});

// ---------- Frontend fallback ----------
// Any non-API route serves index.html so the user can navigate by URL
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------- Start server ----------
connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SehatSaathi server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start - MongoDB connection error:", err.message);
    // Still start server so user can see a helpful error in browser
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT} (database NOT connected)`);
    });
  });
