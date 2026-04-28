import { Router } from "express";
import { requireAuth, AuthRequest } from "./authMiddleware";
import { connectMongo, ScanModel, UserModel } from "./mongo";
import { GoogleGenAI } from "@google/genai";

const router = Router();

function getAI() {
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "dummy";
  if (!baseUrl) throw new Error("Gemini AI not configured");
  return new GoogleGenAI({ apiKey, httpOptions: { baseUrl } });
}

function getLanguageInstruction(language: string) {
  const lang = (language || "English").toLowerCase();
  if (lang.startsWith("hi")) return "Respond ENTIRELY in simple Hindi (हिन्दी). Use easy everyday words that a common person can understand.";
  if (lang.startsWith("mr")) return "Respond ENTIRELY in simple Marathi (मराठी). Use easy everyday words that a common person can understand.";
  if (lang.startsWith("ta")) return "Respond ENTIRELY in simple Tamil (தமிழ்). Use easy everyday words.";
  if (lang.startsWith("bn")) return "Respond ENTIRELY in simple Bengali (বাংলা). Use easy everyday words.";
  return "Respond in simple English. Avoid medical jargon. Use plain words anyone can understand.";
}

function getScanPrompt(type: string, language: string) {
  const langInstruction = getLanguageInstruction(language);

  if (type === "medicine") {
    return `You are a helpful health assistant. Analyze this medicine image. ${langInstruction}

Please tell the patient:
1. What is this medicine called?
2. What is it used for? (in simple words)
3. How is it usually taken? (dose and timing)
4. Any important warnings? (e.g., avoid alcohol, take after food)
5. How to store it?

Keep your answer short, simple, and friendly. Start with "Medicine:" followed by the name.`;
  }
  if (type === "prescription") {
    return `You are a helpful health assistant. Analyze this prescription. ${langInstruction}

Please tell the patient:
1. Which medicines are prescribed and their doses
2. What each medicine does (in simple words)
3. When to take each medicine (before/after food, morning/night)
4. How many days to take them
5. Any special instructions

Keep it short, clear, and easy to understand. Always remind them to follow their doctor's advice.`;
  }
  return `You are a helpful health assistant. Analyze this medical report. ${langInstruction}

Please tell the patient:
1. What test was done and what was found
2. Which values are normal and which are high/low (mark clearly)
3. What does this mean for their health (in simple words)
4. What should they do next?
5. Any lifestyle tips (food, exercise, rest)?

Be simple, caring, and clear. Always say they should show this to their doctor.`;
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const scans = await ScanModel.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json(scans);
  } catch (err) {
    req.log.error(err, "listScans error");
    res.status(500).json({ error: "Failed to get scans" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const { type, imageBase64 } = req.body;
    if (!type || !imageBase64) return res.status(400).json({ error: "Type and image required" });

    // Get user language for AI response
    const userDoc = await UserModel.findById(req.userId).lean() as { language?: string } | null;
    const language = userDoc?.language || "English";

    let aiInsight = "";
    let summary = "";

    try {
      const ai = getAI();
      const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      const mimeType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";

      const modelsToTry = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.5-pro"];
      let lastErr: any = null;
      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [{
              role: "user",
              parts: [
                { text: getScanPrompt(type, language) },
                { inlineData: { mimeType, data: base64Data } }
              ]
            }],
            config: { maxOutputTokens: 8192 }
          });
          aiInsight = response.text || "";
          if (aiInsight) break;
        } catch (e) {
          lastErr = e;
          req.log.warn({ model, err: String(e) }, "Gemini model failed, trying next");
        }
      }
      if (!aiInsight) throw lastErr || new Error("All Gemini models failed");
      const lines = aiInsight.split("\n").filter((l: string) => l.trim());
      summary = lines.slice(0, 2).join(" ").slice(0, 200);
    } catch (aiErr: any) {
      req.log.error(aiErr, "AI scan error");
      const errMsg = aiErr?.message || String(aiErr);
      aiInsight = `${type.charAt(0).toUpperCase() + type.slice(1)} scanned, but AI analysis is temporarily unavailable. Please try again in a moment, or consult your healthcare provider.\n\n(Technical detail: ${errMsg.slice(0, 200)})`;
      summary = "Scan complete - AI analysis unavailable.";
    }

    const scan = await ScanModel.create({
      userId: req.userId,
      type,
      imageBase64: imageBase64.slice(0, 100),
      aiInsight,
      summary
    });

    res.json(scan);
  } catch (err) {
    req.log.error(err, "createScan error");
    res.status(500).json({ error: "Failed to process scan" });
  }
});

export default router;
